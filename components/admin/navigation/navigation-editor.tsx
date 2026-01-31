"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EditorMap } from "./editor-map";
import type { MapNode, MapEdge } from "@/lib/types/graph";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MousePointer2, Plus, GripHorizontal, Save, Trash2, Route, Undo2, Redo2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import { saveMapGraph } from "@/lib/supabase/queries/navigation";
import { toast } from "sonner";

// Simple history stack for Undo/Redo
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  
  // Helper to push state to history
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

  useEffect(() => {
    const loadData = async () => {
      if (db) {
        const loadedNodes = await db.map_nodes.toArray();
        const loadedEdges = await db.map_edges.toArray();
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        // Initialize history
        setHistory([{ nodes: loadedNodes, edges: loadedEdges }]);
        setHistoryIndex(0);
      }
    };
    loadData();
  }, []);

  // Update state wrappers to push history
  const updateNodes = (newNodes: MapNode[]) => {
      setNodes(newNodes);
      pushHistory(newNodes, edges);
  };

  const updateEdges = (newEdges: MapEdge[]) => {
      setEdges(newEdges);
      pushHistory(nodes, newEdges);
  };
  
  // Default edge type for new edges
  const [defaultEdgeType, setDefaultEdgeType] = useState<'walkway' | 'road' | 'car_road'>('walkway');

  useEffect(() => {
    const loadData = async () => {
      if (db) {
        const loadedNodes = await db.map_nodes.toArray();
        const loadedEdges = await db.map_edges.toArray();
        setNodes(loadedNodes);
        setEdges(loadedEdges);
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
  }, [nodes, edges, historyIndex]); // Add dependencies for history wrappers

  const handleNodeSelect = useCallback((id: string) => {
    if (mode === 'add_edge') {
      if (!edgeStartNodeId) {
        setEdgeStartNodeId(id);
        toast.info("Select target node");
      } else {
        if (edgeStartNodeId === id) {
           setEdgeStartNodeId(null);
           return;
        }
        // Check if edge already exists
        const exists = edges.some(e => 
            (e.source_id === edgeStartNodeId && e.target_id === id) || 
            (e.source_id === id && e.target_id === edgeStartNodeId)
        );
        
        if (exists) {
            // Allow overlapping edges if types are different (handled by rendering order or parallel offsets in future)
            // But user specifically asked to overlap "both", implying they want to upgrade an existing edge or add a second one.
            // For now, if we want to "mix" them, we should probably update the existing edge to have more permissions
            // OR allow multiple edges.
            
            // Requirement: "make sure that I can overlap both, it does not gives edge alredy exist"
            // So we remove the blocking check.
            
            // toast.error("Edge already exists");
            // setEdgeStartNodeId(null);
            // return;
        }

        let access: any[] = ['walking'];
        let type: 'walkway' | 'road' = 'walkway';

        if (defaultEdgeType === 'road') {
            type = 'road';
            access = ['walking', 'cycling', 'driving'];
        } else if (defaultEdgeType === 'car_road') {
            type = 'road';
            access = ['cycling', 'driving'];
        }

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
        setEdgeStartNodeId(null);
        toast.success(`Edge created (${defaultEdgeType})`);
      }
    } else {
      setSelectedNodeId(id);
      setEdgeStartNodeId(null);
      setSelectedEdgeId(null);
    }
  }, [mode, edgeStartNodeId, defaultEdgeType, edges, nodes, historyIndex]);

  const handleEdgeSelect = useCallback((id: string) => {
      // Allow selection in any mode except when actively adding something? 
      // Or explicitly only in select mode. User asked "I want to be able to select an edge to delete it".
      // They might be in 'select' mode.
      if (mode === 'select') {
          setSelectedEdgeId(id);
          setSelectedNodeId(null);
      }
  }, [mode]);

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

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    const newNodes = nodes.filter(n => n.id !== selectedNodeId);
    const newEdges = edges.filter(e => e.source_id !== selectedNodeId && e.target_id !== selectedNodeId);
    
    // We need to update both at once for history
    setNodes(newNodes);
    setEdges(newEdges);
    pushHistory(newNodes, newEdges);
    
    setSelectedNodeId(null);
    toast.success("Node deleted");
  }, [selectedNodeId, nodes, edges, historyIndex]);

  const handleDeleteEdge = useCallback(() => {
      if (!selectedEdgeId) return;
      const newEdges = edges.filter(e => e.id !== selectedEdgeId);
      updateEdges(newEdges);
      setSelectedEdgeId(null);
      toast.success("Edge deleted");
  }, [selectedEdgeId, edges, nodes, historyIndex]);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      <div className="flex-1 relative rounded-lg border overflow-hidden">
        <EditorMap
          nodes={nodes}
          edges={edges}
          mode={mode}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          edgeStartNodeId={edgeStartNodeId}
          onNodeAdd={handleNodeAdd}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
          onNodeMove={() => {}}
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
            title="Add Edge"
          >
            <Route className="h-4 w-4" />
          </Button>
          <div className="h-px bg-border my-1" />
          
          <div className="px-2 py-1">
             <Label className="text-xs text-muted-foreground mb-1 block">Edge Type</Label>
             <Select value={defaultEdgeType} onValueChange={(v: any) => setDefaultEdgeType(v)}>
                <SelectTrigger className="h-7 text-xs w-[100px]">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="walkway">Walkway (Walking only)</SelectItem>
                   <SelectItem value="road">Shared Road (Walk + Drive)</SelectItem>
                   <SelectItem value="car_road">Car Road (Drive Only)</SelectItem>
                </SelectContent>
             </Select>
          </div>

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

      <Card className="w-80 p-4 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">Graph Editor</h2>
        <div className="text-sm text-muted-foreground">
          Nodes: {nodes.length} | Edges: {edges.length}
        </div>
        
        {selectedNodeId && (
            <div className="border rounded p-3 bg-muted/50 space-y-3">
                <div className="font-medium">Selected Node</div>
                <div className="text-xs font-mono">{selectedNodeId.slice(0, 8)}...</div>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteNode}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Node
                </Button>
            </div>
        )}

        {selectedEdgeId && (
            <div className="border rounded p-3 bg-muted/50 space-y-3">
                <div className="font-medium">Selected Edge</div>
                <div className="text-xs font-mono">{selectedEdgeId.slice(0, 8)}...</div>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteEdge}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Edge
                </Button>
            </div>
        )}
      </Card>
    </div>
  );
}
