"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EditorMap } from "./editor-map";
import type { MapNode, MapEdge, TransportMode } from "@/lib/types/graph";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MousePointer2, Plus, Save, Trash2, Route, Undo2, Redo2, ArrowLeftRight, ArrowRight, AlertTriangle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { saveMapGraph } from "@/lib/supabase/queries/navigation";
import { toast } from "sonner";

interface HistoryState {
  nodes: MapNode[];
  edges: MapEdge[];
}

export function NavigationEditor() {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [mode, setMode] = useState<'select' | 'add_node' | 'add_edge'>('select');
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  
  const pushHistory = useCallback((newNodes: MapNode[], newEdges: MapEdge[]) => {
      const newState = { nodes: [...newNodes], edges: [...newEdges] };
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          return [...newHistory, newState];
      });
      setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
      if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          setNodes(prevState.nodes);
          setEdges(prevState.edges);
          setHistoryIndex(historyIndex - 1);
          toast.success("Undo");
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          setHistoryIndex(historyIndex + 1);
          toast.success("Redo");
      }
  };

  const updateNodes = (newNodes: MapNode[]) => {
      setNodes(newNodes);
      pushHistory(newNodes, edges);
  };

  const updateEdges = (newEdges: MapEdge[]) => {
      setEdges(newEdges);
      pushHistory(nodes, newEdges);
  };

  const updateGraph = (newNodes: MapNode[], newEdges: MapEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
      pushHistory(newNodes, newEdges);
  };

  useEffect(() => {
    const loadData = async () => {
      if (db) {
        const loadedNodes = await db.map_nodes.toArray();
        const loadedEdges = await db.map_edges.toArray();
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        setHistory([{ nodes: loadedNodes, edges: loadedEdges }]);
        setHistoryIndex(0);
      }
    };
    loadData();
  }, []);

  const handleNodeAdd = useCallback((lat: number, lng: number) => {
    const newNode: MapNode = {
      id: uuidv4(),
      lat,
      lng,
      type: 'node',
    };
    const newNodes = [...nodes, newNode];
    updateNodes(newNodes);
    toast.success("Node added");
  }, [nodes, edges, pushHistory]);

  const handleNodeSelect = useCallback((id: string, multi: boolean) => {
    if (mode === 'add_edge') {
      if (!edgeStartNodeId) {
        setEdgeStartNodeId(id);
      } else {
        if (edgeStartNodeId === id) {
           return;
        }
        
        const access: TransportMode[] = ['walking'];
        const type: 'walkway' | 'road' = 'walkway';

        const newEdge: MapEdge = {
          id: uuidv4(),
          source_id: edgeStartNodeId,
          target_id: id,
          weight: 0,
          bidirectional: true,
          type: type,
          access: access,
        };
        const newEdges = [...edges, newEdge];
        
        updateEdges(newEdges);
        setEdgeStartNodeId(id); 
        
        toast.success(`Edge added`);
      }
    } else {
      if (multi) {
        const newSet = new Set(selectedNodeIds);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        setSelectedNodeIds(newSet);
      } else {
        setSelectedNodeIds(new Set([id]));
        setSelectedEdgeIds(new Set());
        setEdgeStartNodeId(null);
      }
    }
  }, [mode, edgeStartNodeId, edges, selectedNodeIds, selectedEdgeIds, updateEdges]);

  const handleEdgeSelect = useCallback((id: string, multi: boolean) => {
      if (mode === 'select') {
          if (multi) {
            const newSet = new Set(selectedEdgeIds);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            setSelectedEdgeIds(newSet);
          } else {
            setSelectedEdgeIds(new Set([id]));
            setSelectedNodeIds(new Set());
          }
      }
  }, [mode, selectedEdgeIds]);

  const handleSave = async () => {
    if (!db) return;
    try {
      await db.transaction('rw', db.map_nodes, db.map_edges, async () => {
        await db.map_nodes.clear();
        await db.map_nodes.bulkAdd(nodes);
        await db.map_edges.clear();
        await db.map_edges.bulkAdd(edges);
      });

      toast.loading("Syncing to server...");
      const { error } = await saveMapGraph(nodes, edges);
      if (error) {
        throw new Error(error.message);
      }

      toast.dismiss();
      toast.success("Graph saved to server & local");
    } catch (e) {
      toast.dismiss();
      toast.error("Failed to save: " + (e instanceof Error ? e.message : "Unknown error"));
      console.error(e);
    }
  };

  const handleBulkDelete = useCallback(() => {
    const newNodes = nodes.filter(n => !selectedNodeIds.has(n.id));
    const nodeIdsToDelete = selectedNodeIds;
    let newEdges = edges.filter(e => !selectedEdgeIds.has(e.id));
    
    newEdges = newEdges.filter(e => !nodeIdsToDelete.has(e.source_id) && !nodeIdsToDelete.has(e.target_id));
    
    updateGraph(newNodes, newEdges);
    
    setSelectedNodeIds(new Set());
    setSelectedEdgeIds(new Set());
    toast.success("Selection deleted");
  }, [selectedNodeIds, selectedEdgeIds, nodes, edges, updateGraph]);

  useEffect(() => {
      if (mode !== 'add_edge') {
          setEdgeStartNodeId(null);
      }
  }, [mode]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4">
      <div className="flex-1 relative rounded-lg border overflow-hidden min-h-[400px]">
        <EditorMap
          nodes={nodes}
          edges={edges}
          mode={mode}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeIds={selectedEdgeIds}
          edgeStartNodeId={edgeStartNodeId}
          onNodeAdd={handleNodeAdd}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
        />
        
        <Card className="absolute top-4 left-4 p-2 flex flex-col gap-2 z-[1000]">
          <div className="flex gap-1 mb-1 justify-center">
             <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
                 <Undo2 className="h-4 w-4" />
             </Button>
             <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
                 <Redo2 className="h-4 w-4" />
             </Button>
          </div>
          <div className="h-px bg-border my-1" />
          
          <Button
            variant={mode === 'select' ? "default" : "ghost"}
            size="icon"
            onClick={() => setMode('select')}
            title="Select Mode"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === 'add_node' ? "default" : "ghost"}
            size="icon"
            onClick={() => setMode('add_node')}
            title="Add Node"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === 'add_edge' ? "default" : "ghost"}
            size="icon"
            onClick={() => setMode('add_edge')}
            title="Add Edge (Chain)"
          >
            <Route className="h-4 w-4" />
          </Button>
          
          <div className="h-px bg-border my-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            title="Save"
          >
            <Save className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      <Card className="w-full md:w-80 p-4 flex flex-col gap-4 overflow-y-auto">
        <h2 className="font-semibold text-lg">Graph Editor</h2>
        <div className="text-sm text-muted-foreground">
          Nodes: {nodes.length} | Edges: {edges.length}
        </div>
        
        {(selectedNodeIds.size > 0 || selectedEdgeIds.size > 0) && (
            <div className="border rounded p-3 bg-muted/50 space-y-3">
                <div className="font-medium flex justify-between items-center">
                    <span>Selection</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {selectedNodeIds.size + selectedEdgeIds.size} items
                    </span>
                </div>
                
                {selectedNodeIds.size > 0 && (
                    <div className="text-xs text-muted-foreground">
                        {selectedNodeIds.size} Node(s) selected
                    </div>
                )}
                
                {selectedEdgeIds.size > 0 && (
                    <div className="text-xs text-muted-foreground">
                        {selectedEdgeIds.size} Edge(s) selected
                    </div>
                )}

                {selectedEdgeIds.size > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <Label className="text-xs">Bulk Type Change</Label>
                        <Select 
                            onValueChange={(v: MapEdge['type']) => {
                                const newEdges = edges.map(e => 
                                    selectedEdgeIds.has(e.id) ? { ...e, type: v } : e
                                );
                                updateEdges(newEdges);
                                toast.success(`Updated ${selectedEdgeIds.size} edges`);
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Set Type..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="walkway">Walkway</SelectItem>
                                <SelectItem value="road">Road</SelectItem>
                                <SelectItem value="corridor">Corridor</SelectItem>
                                <SelectItem value="stairs">Stairs</SelectItem>
                                <SelectItem value="elevator">Elevator</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <Button variant="destructive" size="sm" className="w-full" onClick={handleBulkDelete}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Selection
                </Button>
            </div>
        )}

        {selectedEdgeIds.size === 1 && (() => {
            const edgeId = Array.from(selectedEdgeIds)[0];
            const edge = edges.find(e => e.id === edgeId);
            if (!edge) return null;
            
            const handleEdgeUpdate = (updates: Partial<MapEdge>) => {
                const newEdges = edges.map(e => 
                    e.id === edgeId ? { ...e, ...updates } : e
                );
                updateEdges(newEdges);
            };
            
            return (
            <div className="border rounded p-3 bg-card space-y-3">
                <div className="font-medium">Edge Properties</div>
                <div className="text-xs font-mono text-muted-foreground">{edgeId.slice(0, 8)}...</div>
                
                <div className="space-y-2">
                    <Label className="text-xs">Edge Type</Label>
                    <Select 
                        value={edge.type} 
                        onValueChange={(v: MapEdge['type']) => handleEdgeUpdate({ type: v })}
                    >
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="walkway">Walkway</SelectItem>
                            <SelectItem value="road">Road</SelectItem>
                            <SelectItem value="corridor">Corridor</SelectItem>
                            <SelectItem value="stairs">Stairs</SelectItem>
                            <SelectItem value="elevator">Elevator</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Allowed Access</Label>
                    <div className="flex flex-wrap gap-2">
                        {(['walking', 'cycling', 'driving'] as const).map(mode => (
                            <div key={mode} className="flex items-center gap-1">
                                <Checkbox 
                                    id={`access-${mode}`}
                                    checked={edge.access?.includes(mode) ?? false}
                                    onCheckedChange={(checked) => {
                                        const current = edge.access || [];
                                        const newAccess = checked 
                                            ? [...current, mode]
                                            : current.filter(m => m !== mode);
                                        handleEdgeUpdate({ access: newAccess });
                                    }}
                                />
                                <Label htmlFor={`access-${mode}`} className="text-xs capitalize cursor-pointer">{mode}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2 border-t">
                    <Checkbox 
                        id="bidirectional"
                        checked={edge.bidirectional}
                        onCheckedChange={(checked) => handleEdgeUpdate({ bidirectional: !!checked })}
                    />
                    <Label htmlFor="bidirectional" className="text-xs flex items-center gap-1 cursor-pointer">
                        {edge.bidirectional ? (
                            <><ArrowLeftRight className="h-3 w-3" /> Two-way</>
                        ) : (
                            <><ArrowRight className="h-3 w-3" /> One-way</>
                        )}
                    </Label>
                </div>
                
                <div className="border-t pt-2 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Checkbox 
                            id="is_closed"
                            checked={edge.is_closed ?? false}
                            onCheckedChange={(checked) => handleEdgeUpdate({ 
                                is_closed: !!checked,
                                closed_from: checked ? edge.closed_from : undefined,
                                closed_until: checked ? edge.closed_until : undefined,
                                closure_reason: checked ? edge.closure_reason : undefined 
                            })}
                        />
                        <Label htmlFor="is_closed" className="text-xs flex items-center gap-1 cursor-pointer">
                            <AlertTriangle className="h-3 w-3" /> Temporarily Closed
                        </Label>
                    </div>
                    
                    {edge.is_closed && (
                        <div className="space-y-2 pl-5">
                            <div>
                                <Label className="text-xs">Closed From</Label>
                                <Input 
                                    type="date" 
                                    className="h-7 text-xs"
                                    value={edge.closed_from?.split('T')[0] ?? ''}
                                    onChange={(e) => handleEdgeUpdate({ 
                                        closed_from: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                    })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Closed Until</Label>
                                <Input 
                                    type="date" 
                                    className="h-7 text-xs"
                                    value={edge.closed_until?.split('T')[0] ?? ''}
                                    onChange={(e) => handleEdgeUpdate({ 
                                        closed_until: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                    })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Reason (optional)</Label>
                                <Input 
                                    type="text" 
                                    className="h-7 text-xs"
                                    placeholder="e.g., Construction"
                                    value={edge.closure_reason ?? ''}
                                    onChange={(e) => handleEdgeUpdate({ closure_reason: e.target.value || undefined })}
                                />
                            </div>

                            <div className="pt-2 border-t">
                                <Label className="text-xs font-semibold flex items-center gap-1 mb-2">
                                    <Clock className="h-3 w-3" /> Recurring Schedule
                                </Label>
                                
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-muted-foreground">Days of Week</Label>
                                    <ToggleGroup 
                                        type="multiple" 
                                        variant="outline" 
                                        size="sm"
                                        className="justify-start flex-wrap gap-1"
                                        value={edge.closure_recurring_days?.map(String) || []}
                                        onValueChange={(vals) => handleEdgeUpdate({ closure_recurring_days: vals.map(Number) })}
                                    >
                                        {['S','M','T','W','T','F','S'].map((day, i) => (
                                            <ToggleGroupItem key={i} value={String(i)} className="h-6 w-6 p-0 text-[10px]">
                                                {day}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground">Start Time</Label>
                                        <Input 
                                            type="time" 
                                            className="h-7 text-xs"
                                            value={edge.closure_recurring_start ?? ''}
                                            onChange={(e) => handleEdgeUpdate({ closure_recurring_start: e.target.value || undefined })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground">End Time</Label>
                                        <Input 
                                            type="time" 
                                            className="h-7 text-xs"
                                            value={edge.closure_recurring_end ?? ''}
                                            onChange={(e) => handleEdgeUpdate({ closure_recurring_end: e.target.value || undefined })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            );
        })()}
      </Card>
    </div>
  );
}