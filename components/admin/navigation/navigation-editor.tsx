"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EditorMap } from "./editor-map";
import type { MapNode, MapEdge } from "@/lib/types/graph";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MousePointer2, Plus, GripHorizontal, Save, Trash2, Route } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import { saveMapGraph } from "@/lib/supabase/queries/navigation";
import { toast } from "sonner";
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [mode, setMode] = useState<'select' | 'add_node' | 'add_edge'>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Default edge type for new edges
  const [defaultEdgeType, setDefaultEdgeType] = useState<'walkway' | 'road'>('walkway');

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
    setNodes((prev) => [...prev, newNode]);
    toast.success("Node added");
  }, []);

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
        const newEdge: MapEdge = {
          id: uuidv4(),
          source_id: edgeStartNodeId,
          target_id: id,
          weight: 0,
          bidirectional: true,
          type: defaultEdgeType,
          access: defaultEdgeType === 'road' ? ['walking', 'cycling', 'driving'] : ['walking'],
        };
        setEdges((prev) => [...prev, newEdge]);
        setEdgeStartNodeId(null);
        toast.success(`Edge created (${defaultEdgeType})`);
      }
    } else {
      setSelectedNodeId(id);
      setEdgeStartNodeId(null);
      // Deselect edge when selecting node
      setSelectedEdgeId(null);
    }
  }, [mode, edgeStartNodeId, defaultEdgeType]);

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
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setEdges(prev => prev.filter(e => e.source_id !== selectedNodeId && e.target_id !== selectedNodeId));
    setSelectedNodeId(null);
    toast.success("Node deleted");
  }, [selectedNodeId]);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      <div className="flex-1 relative rounded-lg border overflow-hidden">
        <EditorMap
          nodes={nodes}
          edges={edges}
          mode={mode}
          selectedNodeId={selectedNodeId}
          onNodeAdd={handleNodeAdd}
          onNodeSelect={handleNodeSelect}
          onNodeMove={() => {}}
        />
        
        <Card className="absolute top-4 left-4 p-2 flex flex-col gap-2 z-[1000]">
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
                   <SelectItem value="walkway">Walkway</SelectItem>
                   <SelectItem value="road">Road</SelectItem>
                   <SelectItem value="corridor">Corridor</SelectItem>
                   <SelectItem value="stairs">Stairs</SelectItem>
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
      </Card>
    </div>
  );
}
