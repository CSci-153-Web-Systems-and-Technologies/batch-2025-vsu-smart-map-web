"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EditorMap } from "./editor-map";
import type { MapNode, MapEdge, TransportMode, GraphNodeType } from "@/lib/types/graph";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MousePointer2, Plus, Save, Trash2, Route, Undo2, Redo2, ArrowLeftRight, ArrowRight, AlertTriangle, Clock, Wand2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { saveMapGraph } from "@/lib/supabase/queries/navigation";
import { getFacilitiesLite } from "@/lib/supabase/queries/facilities";
import { getDistance } from "@/lib/pathfinding/astar";
import type { FacilityLite } from "@/lib/types/facility";
import { toast } from "sonner";

interface HistoryState {
  nodes: MapNode[];
  edges: MapEdge[];
}

export function NavigationEditor() {
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [facilities, setFacilities] = useState<FacilityLite[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [mode, setMode] = useState<'select' | 'add_node' | 'add_edge'>('select');
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [newEdgeBidirectional, setNewEdgeBidirectional] = useState(true);
  const [newEdgeType, setNewEdgeType] = useState<'walkway' | 'road' | 'car_road'>('walkway');
  
  const pushHistory = useCallback((newNodes: MapNode[], newEdges: MapEdge[]) => {
      const newState = { nodes: [...newNodes], edges: [...newEdges] };
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          return [...newHistory, newState];
      });
      setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          setNodes(prevState.nodes);
          setEdges(prevState.edges);
          setHistoryIndex(historyIndex - 1);
          toast.success("Undo");
      }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          setHistoryIndex(historyIndex + 1);
          toast.success("Redo");
      }
  }, [historyIndex, history]);

  const updateNodes = useCallback((newNodes: MapNode[]) => {
      setNodes(newNodes);
      pushHistory(newNodes, edges);
  }, [edges, pushHistory]);

  const updateEdges = useCallback((newEdges: MapEdge[]) => {
      setEdges(newEdges);
      pushHistory(nodes, newEdges);
  }, [nodes, pushHistory]);

  const updateGraph = useCallback((newNodes: MapNode[], newEdges: MapEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
      pushHistory(newNodes, newEdges);
  }, [pushHistory]);

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
      const { data } = await getFacilitiesLite();
      if (data) setFacilities(data);
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
  }, [nodes, updateNodes]);

  const handleNodeSelect = useCallback((id: string, multi: boolean) => {
    if (mode === 'add_edge') {
      if (!edgeStartNodeId) {
        setEdgeStartNodeId(id);
      } else {
        if (edgeStartNodeId === id) {
           return;
        }
        
        const existingEdge = edges.find(e => 
            (e.source_id === edgeStartNodeId && e.target_id === id) || 
            (e.source_id === id && e.target_id === edgeStartNodeId)
        );

        if (existingEdge) {
            toast.info("Edge already exists between these nodes");
            setEdgeStartNodeId(id);
            return;
        }

         let access: TransportMode[] = ['walking'];
         let type: MapEdge['type'] = 'walkway';

         if (newEdgeType === 'road') {
             type = 'road';
             access = ['walking', 'cycling', 'driving'];
         } else if (newEdgeType === 'car_road') {
             type = 'road';
             access = ['cycling', 'driving'];
         }

         const newEdge: MapEdge = {
           id: uuidv4(),
           source_id: edgeStartNodeId,
           target_id: id,
           weight: 0,
           bidirectional: newEdgeBidirectional,
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
  }, [mode, edgeStartNodeId, edges, selectedNodeIds, updateEdges, newEdgeBidirectional, newEdgeType]);

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

  const getEdgeTypePreset = (edge: MapEdge) => {
      if (edge.type === 'walkway') return 'walkway';
      if (edge.type === 'road') {
          if (edge.access?.includes('walking')) return 'road';
          return 'car_road';
      }
      return edge.type;
  };

  const handleBulkTypePresetChange = (preset: string, edgeIds: Set<string>) => {
      let type: MapEdge['type'] = 'walkway';
      let access: TransportMode[] = ['walking'];

      if (preset === 'walkway') {
          type = 'walkway';
          access = ['walking'];
      } else if (preset === 'road') {
          type = 'road';
          access = ['walking', 'cycling', 'driving'];
      } else if (preset === 'car_road') {
          type = 'road';
          access = ['cycling', 'driving'];
      }

      const newEdges = edges.map(e => 
          edgeIds.has(e.id) ? { ...e, type, access } : e
      );
      updateEdges(newEdges);
  };

  const handleSwapEdgeDirection = (edgeId: string) => {
      const newEdges = edges.map(e => {
          if (e.id === edgeId) {
              return {
                  ...e,
                  source_id: e.target_id,
                  target_id: e.source_id
              };
          }
          return e;
      });
      updateEdges(newEdges);
      toast.success("Direction swapped");
  };

  const autoAssociateBuildings = (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || facilities.length === 0) return;

      const MAX_DIST = 20; 
      const nearby = facilities.filter(f => {
          const d = getDistance(node.lat, node.lng, f.coordinates.lat, f.coordinates.lng);
          return d <= MAX_DIST;
      }).sort((a, b) => {
          const da = getDistance(node.lat, node.lng, a.coordinates.lat, a.coordinates.lng);
          const db = getDistance(node.lat, node.lng, b.coordinates.lat, b.coordinates.lng);
          return da - db;
      });

      if (nearby.length === 0) {
          toast.info("No buildings found within 20m");
          return;
      }

      const currentIds = node.building_ids ?? [];
      let nextIndex = 0;

      if (currentIds.length > 0) {
          const firstId = currentIds[0];
          const currentIndex = nearby.findIndex(f => f.id === firstId);
          if (currentIndex !== -1) {
              nextIndex = (currentIndex + 1) % nearby.length;
          }
      }

      const nextFacility = nearby[nextIndex];
      handleBulkNodeUpdate({ building_ids: [nextFacility.id] }, new Set([nodeId]));
      toast.success(`Suggested: ${nextFacility.name} (${nextIndex + 1}/${nearby.length})`);
  };

  const handleBulkEdgeUpdate = (updates: Partial<MapEdge>, edgeIds: Set<string>) => {
      const newEdges = edges.map(e => 
          edgeIds.has(e.id) ? { ...e, ...updates } : e
      );
      updateEdges(newEdges);
  };

  const handleBulkNodeUpdate = (updates: Partial<MapNode>, nodeIds: Set<string>) => {
      const newNodes = nodes.map(n => 
          nodeIds.has(n.id) ? { ...n, ...updates } : n
      );
      updateNodes(newNodes);
  };

  const getInferredNodeType = useCallback((nodeId: string): GraphNodeType | null => {
      const connectedEdges = edges.filter(e => e.source_id === nodeId || e.target_id === nodeId);
      const oneWayEdges = connectedEdges.filter(e => !e.bidirectional);
      
      if (oneWayEdges.length === 0) return null;

      const inEdges = oneWayEdges.filter(e => e.target_id === nodeId);
      const outEdges = oneWayEdges.filter(e => e.source_id === nodeId);

      if (inEdges.length === 0 && outEdges.length > 0) return 'path_start';
      if (inEdges.length > 0 && outEdges.length > 0) return 'path_middle';
      if (inEdges.length > 0 && outEdges.length === 0) return 'path_end';
      
      return null;
  }, [edges]);

  const getConnectedGroups = useCallback(() => {
      const visited = new Set<string>();
      const groups: string[][] = [];

      nodes.forEach(node => {
          if (!visited.has(node.id)) {
              const group: string[] = [];
              const queue = [node.id];
              visited.add(node.id);

              while (queue.length > 0) {
                  const curr = queue.shift()!;
                  group.push(curr);

                  edges.forEach(edge => {
                      if (edge.source_id === curr && !visited.has(edge.target_id)) {
                          visited.add(edge.target_id);
                          queue.push(edge.target_id);
                      } else if (edge.target_id === curr && !visited.has(edge.source_id)) {
                          visited.add(edge.source_id);
                          queue.push(edge.source_id);
                      }
                  });
              }
              groups.push(group);
          }
      });
      return groups;
  }, [nodes, edges]);

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

          {mode === 'add_edge' && (
              <div className="flex flex-col gap-1 border-t pt-1">
                  <Button
                    variant={newEdgeBidirectional ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setNewEdgeBidirectional(true)}
                    title="Two-way"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={!newEdgeBidirectional ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setNewEdgeBidirectional(false)}
                    title="One-way"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="h-px bg-border my-1" />
                  <Select value={newEdgeType} onValueChange={(v: 'walkway' | 'road' | 'car_road') => setNewEdgeType(v)}>
                      <SelectTrigger className="h-8 w-8 p-0 border-none bg-transparent hover:bg-accent flex items-center justify-center">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="walkway">Walkway</SelectItem>
                          <SelectItem value="road">Shared Road</SelectItem>
                          <SelectItem value="car_road">Car Road (Drive Only)</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          )}
          
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

                 <Button variant="destructive" size="sm" className="w-full" onClick={handleBulkDelete}>
                     <Trash2 className="h-4 w-4 mr-2" /> Delete Selection
                 </Button>
             </div>
         )}

         {selectedNodeIds.size > 0 && (() => {
             const firstNodeId = Array.from(selectedNodeIds)[0];
             const firstNode = nodes.find(n => n.id === firstNodeId);
             if (!firstNode) return null;
             
             const allSameType = Array.from(selectedNodeIds).every(id => nodes.find(n => n.id === id)?.type === firstNode.type);
             const commonType = allSameType ? firstNode.type : undefined;

             const inferredType = selectedNodeIds.size === 1 ? getInferredNodeType(firstNodeId) : null;

             return (
               <div className="border rounded p-3 bg-card space-y-3">
                 <div className="font-medium">Node Properties {selectedNodeIds.size > 1 && `(${selectedNodeIds.size})`}</div>
                 
                 <div className="space-y-2">
                    <Label className="text-xs">Node Type</Label>
                    {inferredType ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-1">
                                <div className={cn(
                                    "flex-1 text-[10px] px-1 h-7 flex items-center justify-center rounded border",
                                    firstNode.type === 'path_start' ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    Start
                                </div>
                                <div className={cn(
                                    "flex-1 text-[10px] px-1 h-7 flex items-center justify-center rounded border",
                                    firstNode.type === 'path_middle' ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    Middle
                                </div>
                                <div className={cn(
                                    "flex-1 text-[10px] px-1 h-7 flex items-center justify-center rounded border",
                                    firstNode.type === 'path_end' ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    End
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                Auto-detected from one-way connections.
                            </p>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-[10px] h-7"
                                onClick={() => handleBulkNodeUpdate({ type: inferredType }, selectedNodeIds)}
                                disabled={firstNode.type === inferredType}
                            >
                                Apply {inferredType.replace('path_', '')} State
                            </Button>
                        </div>
                    ) : (
                        <Select 
                            value={commonType} 
                            onValueChange={(v: GraphNodeType) => handleBulkNodeUpdate({ type: v }, selectedNodeIds)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder={!allSameType ? "Multiple Types" : "Select Type..."} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="node">Standard Node</SelectItem>
                                <SelectItem value="building_entry">Building Entry</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                 </div>

                {selectedNodeIds.size === 1 && firstNode.type === 'building_entry' && (
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Associated Buildings</Label>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                title="Auto-associate closest buildings"
                                onClick={() => autoAssociateBuildings(firstNodeId)}
                            >
                                <Wand2 className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-muted/30">
                            {facilities.map(f => {
                                const isChecked = firstNode.building_ids?.includes(f.id) ?? false;
                                return (
                                    <div key={f.id} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`f-${f.id}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => {
                                                const currentIds = firstNode.building_ids ?? [];
                                                const newIds = checked 
                                                    ? [...currentIds, f.id]
                                                    : currentIds.filter(id => id !== f.id);
                                                handleBulkNodeUpdate({ building_ids: newIds }, selectedNodeIds);
                                            }}
                                        />
                                        <Label htmlFor={`f-${f.id}`} className="text-[10px] leading-tight cursor-pointer">
                                            {f.name}
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {selectedNodeIds.size === 1 && (
                    <div className="space-y-2 pt-2 border-t">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Automata State</Label>
                        <div className="text-xs p-2 bg-muted rounded flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Current:</span>
                                <span className="font-mono text-primary uppercase">{firstNode.type}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                <span className="text-muted-foreground">In-Degree:</span>
                                <span className="font-mono">{edges.filter(e => e.target_id === firstNodeId || (e.bidirectional && e.source_id === firstNodeId)).length}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                <span className="text-muted-foreground">Out-Degree:</span>
                                <span className="font-mono">{edges.filter(e => e.source_id === firstNodeId || (e.bidirectional && e.target_id === firstNodeId)).length}</span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                <span className="text-muted-foreground">Group Size:</span>
                                <span className="font-mono">{getConnectedGroups().find(g => g.includes(firstNodeId))?.length ?? 0} node(s)</span>
                            </div>
                        </div>
                    </div>
                )}
               </div>
             );
         })()}

         {selectedEdgeIds.size > 0 && (() => {
             const firstEdgeId = Array.from(selectedEdgeIds)[0];
             const firstEdge = edges.find(e => e.id === firstEdgeId);
             if (!firstEdge) return null;

             const allSameType = Array.from(selectedEdgeIds).every(id => {
                 const e = edges.find(edge => edge.id === id);
                 return e && getEdgeTypePreset(e) === getEdgeTypePreset(firstEdge);
             });
             const commonPreset = allSameType ? getEdgeTypePreset(firstEdge) : undefined;
             
             const allSameBidi = Array.from(selectedEdgeIds).every(id => edges.find(e => e.id === id)?.bidirectional === firstEdge.bidirectional);
             const commonBidi = allSameBidi ? firstEdge.bidirectional : false;

             const allSameClosed = Array.from(selectedEdgeIds).every(id => edges.find(e => e.id === id)?.is_closed === firstEdge.is_closed);
             const commonClosed = allSameClosed ? firstEdge.is_closed : false;

             return (
             <div className="border rounded p-3 bg-card space-y-3">
                 <div className="font-medium">Edge Properties {selectedEdgeIds.size > 1 && `(${selectedEdgeIds.size})`}</div>
                 
                 <div className="space-y-2">
                     <Label className="text-xs">Edge Type</Label>
                     <Select 
                         value={commonPreset} 
                         onValueChange={(v) => handleBulkTypePresetChange(v, selectedEdgeIds)}
                     >
                         <SelectTrigger className="h-8 text-xs">
                             <SelectValue placeholder={!allSameType ? "Multiple Types" : "Select Type..."} />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="walkway">Walkway (Walking only)</SelectItem>
                             <SelectItem value="road">Shared Road (Walk + Drive)</SelectItem>
                             <SelectItem value="car_road">Car Road (Drive Only)</SelectItem>
                         </SelectContent>
                     </Select>
                 </div>
                 
                 <div className="flex items-center gap-2 pt-2 border-t">
                     <Checkbox 
                         id="bidirectional"
                         checked={commonBidi}
                         onCheckedChange={(checked) => handleBulkEdgeUpdate({ bidirectional: !!checked }, selectedEdgeIds)}
                     />
                     <Label htmlFor="bidirectional" className="text-xs flex items-center gap-1 cursor-pointer flex-1">
                         {commonBidi ? (
                             <><ArrowLeftRight className="h-3 w-3" /> Two-way</>
                         ) : (
                             <><ArrowRight className="h-3 w-3" /> One-way</>
                         )}
                     </Label>
                     {selectedEdgeIds.size === 1 && !commonBidi && (
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            title="Swap Direction"
                            onClick={() => handleSwapEdgeDirection(firstEdgeId)}
                         >
                            <RefreshCw className="h-3 w-3" />
                         </Button>
                     )}
                 </div>
                 
                 <div className="border-t pt-2 mt-2">
                     <div className="flex items-center gap-2 mb-2">
                         <Checkbox 
                             id="is_closed"
                             checked={commonClosed ?? false}
                             onCheckedChange={(checked) => handleBulkEdgeUpdate({ 
                                 is_closed: !!checked,
                                 closed_from: checked ? firstEdge.closed_from : undefined,
                                 closed_until: checked ? firstEdge.closed_until : undefined,
                                 closure_reason: checked ? firstEdge.closure_reason : undefined 
                             }, selectedEdgeIds)}
                         />
                         <Label htmlFor="is_closed" className="text-xs flex items-center gap-1 cursor-pointer">
                             <AlertTriangle className="h-3 w-3" /> Temporarily Closed
                         </Label>
                     </div>
                     
                     {selectedEdgeIds.size === 1 && firstEdge.is_closed && (
                         <div className="space-y-2 pl-5">
                             <div>
                                 <Label className="text-xs">Closed From</Label>
                                 <Input 
                                     type="date" 
                                     className="h-7 text-xs"
                                     value={firstEdge.closed_from?.split('T')[0] ?? ''}
                                     onChange={(e) => handleBulkEdgeUpdate({ 
                                         closed_from: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                     }, selectedEdgeIds)}
                                 />
                             </div>
                             <div>
                                 <Label className="text-xs">Closed Until</Label>
                                 <Input 
                                     type="date" 
                                     className="h-7 text-xs"
                                     value={firstEdge.closed_until?.split('T')[0] ?? ''}
                                     onChange={(e) => handleBulkEdgeUpdate({ 
                                         closed_until: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                     }, selectedEdgeIds)}
                                 />
                             </div>
                             <div>
                                 <Label className="text-xs">Reason (optional)</Label>
                                 <Input 
                                     type="text" 
                                     className="h-7 text-xs"
                                     placeholder="e.g., Construction"
                                     value={firstEdge.closure_reason ?? ''}
                                     onChange={(e) => handleBulkEdgeUpdate({ closure_reason: e.target.value || undefined }, selectedEdgeIds)}
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
                                         value={firstEdge.closure_recurring_days?.map(String) || []}
                                         onValueChange={(vals) => handleBulkEdgeUpdate({ closure_recurring_days: vals.map(Number) }, selectedEdgeIds)}
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
                                             value={firstEdge.closure_recurring_start ?? ''}
                                             onChange={(e) => handleBulkEdgeUpdate({ closure_recurring_start: e.target.value || undefined }, selectedEdgeIds)}
                                         />
                                     </div>
                                     <div>
                                         <Label className="text-[10px] text-muted-foreground">End Time</Label>
                                         <Input 
                                             type="time" 
                                             className="h-7 text-xs"
                                             value={firstEdge.closure_recurring_end ?? ''}
                                             onChange={(e) => handleBulkEdgeUpdate({ closure_recurring_end: e.target.value || undefined }, selectedEdgeIds)}
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
