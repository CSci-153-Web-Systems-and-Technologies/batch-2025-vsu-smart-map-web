"use client";

import { useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { EditorMap } from "./editor-map";
import type { MapNode, MapEdge, TransportMode, GraphNodeType } from "@/lib/types/graph";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MousePointer2, Plus, Save, Trash2, Route, Undo2, Redo2, ArrowLeftRight, ArrowRight, AlertTriangle, Clock, Wand2, RefreshCw, Footprints, Bike, Car, ListChecks } from "lucide-react";
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
  
  const [isAddNodeMode, setIsAddNodeMode] = useState(false);
  const [isAddEdgeMode, setIsAddEdgeMode] = useState(false);
  
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());
  const [edgeStartNodeId, setEdgeStartNodeId] = useState<string | null>(null);
  const [newEdgeBidirectional, setNewEdgeBidirectional] = useState(true);
  const [newEdgeType, setNewEdgeType] = useState<'walkway' | 'road' | 'car_road'>('walkway');
  const [buildingSearchQuery, setBuildingSearchQuery] = useState("");
  
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
    
    // If adding edges simultaneously, connect to the previous node
    if (isAddEdgeMode && edgeStartNodeId) {
        // Prevent self-loop if clicked too fast or logic error (though usually startNode is different)
        if (edgeStartNodeId !== newNode.id) {
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
                target_id: newNode.id,
                weight: 0,
                bidirectional: newEdgeBidirectional,
                type: type,
                access: access,
              };
              
              const newEdges = [...edges, newEdge];
              updateGraph(newNodes, newEdges); // Update both
              setEdgeStartNodeId(newNode.id); // Advance chain
              toast.success("Node & Edge added");
              return;
        }
    }
    
    updateNodes(newNodes);
    if (isAddEdgeMode) {
        setEdgeStartNodeId(newNode.id); // Start chain if not started
    }
    toast.success("Node added");
  }, [nodes, edges, updateNodes, updateGraph, isAddEdgeMode, edgeStartNodeId, newEdgeBidirectional, newEdgeType]);

  const handleNodeSelect = useCallback((id: string, multi: boolean) => {
    if (isAddEdgeMode) {
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
  }, [isAddEdgeMode, edgeStartNodeId, edges, selectedNodeIds, updateEdges, newEdgeBidirectional, newEdgeType]);

  const handleEdgeSelect = useCallback((id: string, multi: boolean) => {
      // Allow selection only if NOT adding nodes/edges, OR if we decide to allow it.
      // Standard behavior: 'select' mode only.
      if (!isAddNodeMode && !isAddEdgeMode) {
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
  }, [isAddNodeMode, isAddEdgeMode, selectedEdgeIds]);

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
      if (!isAddEdgeMode) {
          setEdgeStartNodeId(null);
      }
  }, [isAddEdgeMode]);

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
      handleBulkSwapEdgeDirection(new Set([edgeId]));
  };

  const handleBulkSwapEdgeDirection = (edgeIds: Set<string>) => {
      const newEdges = edges.map(e => {
          if (edgeIds.has(e.id)) {
              return {
                  ...e,
                  source_id: e.target_id,
                  target_id: e.source_id
              };
          }
          return e;
      });
      updateEdges(newEdges);
      toast.success(`Direction swapped for ${edgeIds.size} edge(s)`);
  };

  const autoAssociateBuildings = (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || facilities.length === 0) return;

      const MAX_DIST = 50; 
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

  const handleSwapNodeDirection = (nodeIds: Set<string>) => {
      const edgeIdsToSwap = new Set<string>();
      edges.forEach(e => {
          if (!e.bidirectional && (nodeIds.has(e.source_id) || nodeIds.has(e.target_id))) {
              edgeIdsToSwap.add(e.id);
          }
      });

      if (edgeIdsToSwap.size === 0) {
          toast.info("No one-way edges connected to selected nodes");
          return;
      }

      const newEdges = edges.map(e => {
          if (edgeIdsToSwap.has(e.id)) {
              return {
                  ...e,
                  source_id: e.target_id,
                  target_id: e.source_id
              };
          }
          return e;
      });
      updateEdges(newEdges);
      toast.success(`Swapped direction of ${edgeIdsToSwap.size} edge(s)`);
  };

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

  const handleNodeMove = useCallback((id: string, lat: number, lng: number) => {
      const newNodes = nodes.map(n => n.id === id ? { ...n, lat, lng } : n);
      setNodes(newNodes);
      pushHistory(newNodes, edges);
  }, [nodes, edges, pushHistory]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-4">
      <div className="flex-1 relative rounded-lg border overflow-hidden min-h-[400px]">
        <EditorMap
          nodes={nodes}
          edges={edges}
          mode={isAddNodeMode && isAddEdgeMode ? 'mixed' : (isAddNodeMode ? 'add_node' : (isAddEdgeMode ? 'add_edge' : 'select')) as any}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeIds={selectedEdgeIds}
          edgeStartNodeId={edgeStartNodeId}
          onNodeAdd={handleNodeAdd}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
          onNodeMove={handleNodeMove}
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
            variant={(!isAddNodeMode && !isAddEdgeMode) ? "default" : "ghost"}
            size="icon"
            onClick={() => { setIsAddNodeMode(false); setIsAddEdgeMode(false); }}
            title="Select Mode"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button
            variant={isAddNodeMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setIsAddNodeMode(!isAddNodeMode)}
            title="Add Node"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant={isAddEdgeMode ? "default" : "ghost"}
            size="icon"
            onClick={() => setIsAddEdgeMode(!isAddEdgeMode)}
            title="Add Edge (Chain)"
          >
            <Route className="h-4 w-4" />
          </Button>

          {isAddEdgeMode && (
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
                          <SelectValue>
                              {newEdgeType === 'walkway' && <Footprints className="h-4 w-4" />}
                              {newEdgeType === 'road' && <div className="relative h-4 w-4"><Footprints className="h-3 w-3 absolute -top-0.5 -left-0.5" /><Car className="h-3 w-3 absolute -bottom-0.5 -right-0.5" /></div>}
                              {newEdgeType === 'car_road' && <Car className="h-4 w-4" />}
                          </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="walkway">
                              <div className="flex items-center gap-2">
                                  <Footprints className="h-4 w-4" />
                                  <span>Walkway</span>
                              </div>
                          </SelectItem>
                          <SelectItem value="road">
                              <div className="flex items-center gap-2">
                                  <Route className="h-4 w-4" />
                                  <span>Shared Road</span>
                              </div>
                          </SelectItem>
                          <SelectItem value="car_road">
                              <div className="flex items-center gap-2">
                                  <Car className="h-4 w-4" />
                                  <span>Car Road</span>
                              </div>
                          </SelectItem>
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

              const inferredTypes = Array.from(selectedNodeIds).map(id => ({ id, type: getInferredNodeType(id) }));
              const allInferred = inferredTypes.every(t => t.type !== null);
              const commonInferred = allInferred && inferredTypes.every(t => t.type === inferredTypes[0].type) ? inferredTypes[0].type : null;
              const hasAnyInferred = inferredTypes.some(t => t.type !== null);

              return (
                <div className="border rounded p-3 bg-card space-y-3">
                  <div className="font-medium flex justify-between items-center">
                      <span>Node Properties {selectedNodeIds.size > 1 && `(${selectedNodeIds.size})`}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        title="Swap connection directions"
                        onClick={() => handleSwapNodeDirection(selectedNodeIds)}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                  </div>
                  
                  <div className="space-y-2">
                     <Label className="text-xs">Node Type</Label>
                     {hasAnyInferred ? (
                         <div className="flex flex-col gap-2">
                             <div className="flex gap-1">
                                 <div className={cn(
                                     "flex-1 text-[10px] px-1 h-7 flex items-center justify-center rounded border",
                                     commonType === 'path_start' ? "bg-primary text-primary-foreground" : "bg-muted"
                                 )}>
                                     Start
                                 </div>
                                 <div className={cn(
                                     "flex-1 text-[10px] px-1 h-7 flex items-center justify-center rounded border",
                                     commonType === 'path_middle' ? "bg-primary text-primary-foreground" : "bg-muted"
                                 )}>
                                     Middle
                                 </div>
                                 <div className={cn(
                                     "flex-1 text-[10px] px-1 h-7 flex items-center justify-center rounded border",
                                     commonType === 'path_end' ? "bg-primary text-primary-foreground" : "bg-muted"
                                 )}>
                                     End
                                 </div>
                             </div>
                             <p className="text-[10px] text-muted-foreground italic">
                                 {selectedNodeIds.size === 1 
                                    ? "Auto-detected from one-way connections." 
                                    : `Auto-detected roles for ${inferredTypes.filter(t => t.type !== null).length}/${selectedNodeIds.size} nodes.`}
                             </p>
                             <Button 
                                 variant="outline" 
                                 size="sm" 
                                 className="w-full text-[10px] h-7"
                                 onClick={() => {
                                     const newNodes = nodes.map(n => {
                                         if (selectedNodeIds.has(n.id)) {
                                             const inferred = getInferredNodeType(n.id);
                                             if (inferred) return { ...n, type: inferred };
                                         }
                                         return n;
                                     });
                                     updateNodes(newNodes);
                                     toast.success("Applied auto-detected roles");
                                 }}
                             >
                                 <Wand2 className="h-3 w-3 mr-2" /> Auto-apply Roles
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
                        <div className="flex flex-col gap-2">
                            <Input 
                                type="text" 
                                placeholder="Search buildings..." 
                                className="h-7 text-[10px]"
                                value={buildingSearchQuery}
                                onChange={(e) => setBuildingSearchQuery(e.target.value)}
                            />
                            <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2 bg-muted/30">
                                {facilities
                                    .filter(f => f.name.toLowerCase().includes(buildingSearchQuery.toLowerCase()))
                                    .map(f => {
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
                                    })
                                }
                            </div>
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

              const allSameUntilToggled = Array.from(selectedEdgeIds).every(id => edges.find(e => e.id === id)?.closed_until_toggled === firstEdge.closed_until_toggled);
              const commonUntilToggled = allSameUntilToggled ? firstEdge.closed_until_toggled : false;

              const handleApplyClosureToPath = () => {
                  const visited = new Set<string>();
                  const queue = [...Array.from(selectedEdgeIds)];
                  const pathEdges = new Set<string>(queue);

                  while (queue.length > 0) {
                      const currId = queue.shift()!;
                      const currEdge = edges.find(e => e.id === currId);
                      if (!currEdge) continue;

                      // Find connected edges
                      const connected = edges.filter(e => 
                          !pathEdges.has(e.id) && 
                          (e.source_id === currEdge.source_id || e.source_id === currEdge.target_id || 
                           e.target_id === currEdge.source_id || e.target_id === currEdge.target_id)
                      );

                      connected.forEach(e => {
                          pathEdges.add(e.id);
                          queue.push(e.id);
                      });
                  }

                  const updates = {
                      is_closed: firstEdge.is_closed,
                      closed_until_toggled: firstEdge.closed_until_toggled,
                      closed_from: firstEdge.closed_from,
                      closed_until: firstEdge.closed_until,
                      closure_reason: firstEdge.closure_reason,
                      closure_recurring_days: firstEdge.closure_recurring_days,
                      closure_recurring_start: firstEdge.closure_recurring_start,
                      closure_recurring_end: firstEdge.closure_recurring_end,
                      closure_daily_schedule: firstEdge.closure_daily_schedule,
                  };

                  handleBulkEdgeUpdate(updates, pathEdges);
                  toast.success(`Applied closure settings to ${pathEdges.size} edges in path`);
              };

              return (

             <div className="border rounded p-3 bg-card space-y-3">
                 <div className="font-medium">Edge Properties {selectedEdgeIds.size > 1 && `(${selectedEdgeIds.size})`}</div>
                 
                 <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1"><Route className="h-3 w-3" /> Edge Type</Label>
                      <Select 
                          value={commonPreset} 
                          onValueChange={(v) => handleBulkTypePresetChange(v, selectedEdgeIds)}
                      >
                          <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={!allSameType ? "Multiple Types" : "Select Type..."}>
                                  {commonPreset === 'walkway' && <Footprints className="h-4 w-4" />}
                                  {commonPreset === 'road' && <div className="relative h-4 w-4"><Footprints className="h-3 w-3 absolute -top-0.5 -left-0.5" /><Car className="h-3 w-3 absolute -bottom-0.5 -right-0.5" /></div>}
                                  {commonPreset === 'car_road' && <Car className="h-4 w-4" />}
                              </SelectValue>
                          </SelectTrigger>

                          <SelectContent>
                              <SelectItem value="walkway">
                                  <div className="flex items-center gap-2">
                                      <Footprints className="h-3 w-3" />
                                      <span>Walkway</span>
                                  </div>
                              </SelectItem>
                              <SelectItem value="road">
                                  <div className="flex items-center gap-2">
                                      <Route className="h-3 w-3" />
                                      <span>Shared Road</span>
                                  </div>
                              </SelectItem>
                              <SelectItem value="car_road">
                                  <div className="flex items-center gap-2">
                                      <Car className="h-3 w-3" />
                                      <span>Car Road</span>
                                  </div>
                              </SelectItem>
                          </SelectContent>
                      </Select>

                 </div>
                 
                 <div className="flex items-center gap-2 pt-2 border-t">
                     <ToggleGroup type="single" value={commonBidi ? "bidi" : "one-way"} onValueChange={(val) => {
                         if (val) handleBulkEdgeUpdate({ bidirectional: val === "bidi" }, selectedEdgeIds);
                     }}>
                        <ToggleGroupItem value="bidi" size="sm" aria-label="Two-way" className="h-8 px-2 text-xs">
                            <ArrowLeftRight className="h-3 w-3 mr-1" /> Two-way
                        </ToggleGroupItem>
                        <ToggleGroupItem value="one-way" size="sm" aria-label="One-way" className="h-8 px-2 text-xs">
                            <ArrowRight className="h-3 w-3 mr-1" /> One-way
                        </ToggleGroupItem>
                     </ToggleGroup>
                     
                     {!commonBidi && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 ml-auto"
                            title="Swap Direction"
                            onClick={() => handleBulkSwapEdgeDirection(selectedEdgeIds)}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                     )}
                  </div>

                 
                  <div className="border-t pt-2 mt-2">
                      <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
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
                            <Label htmlFor="is_closed" className="text-xs flex items-center gap-1 cursor-pointer font-semibold">
                                <AlertTriangle className="h-3 w-3" /> Temporarily Closed
                            </Label>
                          </div>
                          
                          {firstEdge.is_closed && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                title="Apply these closure settings to the entire connected path"
                                onClick={handleApplyClosureToPath}
                              >
                                  <ListChecks className="h-3 w-3" />
                              </Button>
                          )}
                      </div>
                      
                      {selectedEdgeIds.size === 1 && firstEdge.is_closed && (
                          <div className="space-y-2 pl-5">
                              <div className="flex items-center gap-2">
                                  <Checkbox 
                                      id="until_toggled"
                                      checked={commonUntilToggled ?? false}
                                      onCheckedChange={(checked) => handleBulkEdgeUpdate({ 
                                          closed_until_toggled: !!checked 
                                      }, selectedEdgeIds)}
                                  />
                                  <Label htmlFor="until_toggled" className="text-[10px] cursor-pointer">
                                      Until Toggled (Permanent but toggleable)
                                  </Label>
                              </div>

                              {!commonUntilToggled && (
                                <>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div>
                                          <Label className="text-[10px]">Closed From</Label>
                                          <Input 
                                              type="date" 
                                              className="h-7 text-[10px]"
                                              value={firstEdge.closed_from?.split('T')[0] ?? ''}
                                              onChange={(e) => handleBulkEdgeUpdate({ 
                                                  closed_from: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                              }, selectedEdgeIds)}
                                          />
                                      </div>
                                      <div>
                                          <Label className="text-[10px]">Closed Until</Label>
                                          <Input 
                                              type="date" 
                                              className="h-7 text-[10px]"
                                              value={firstEdge.closed_until?.split('T')[0] ?? ''}
                                              onChange={(e) => handleBulkEdgeUpdate({ 
                                                  closed_until: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                                              }, selectedEdgeIds)}
                                          />
                                      </div>
                                  </div>
                                </>
                              )}
                              
                              <div>
                                  <Label className="text-[10px]">Reason (optional)</Label>
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
                                      <div className="flex items-center justify-between">
                                        <Label className="text-[10px] text-muted-foreground">Days & Times</Label>
                                      </div>
                                      
                                      <div className="flex flex-col gap-1">
                                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => {
                                              const isEnabled = firstEdge.closure_recurring_days?.includes(i);
                                              const daily = firstEdge.closure_daily_schedule?.[i];
                                              
                                              return (
                                                  <div key={i} className="flex items-center gap-2 bg-muted/30 p-1 rounded">
                                                      <Checkbox 
                                                          id={`day-${i}`}
                                                          checked={isEnabled}
                                                          onCheckedChange={(checked) => {
                                                              const currentDays = firstEdge.closure_recurring_days ?? [];
                                                              const nextDays = checked 
                                                                ? [...currentDays, i] 
                                                                : currentDays.filter(d => d !== i);
                                                              handleBulkEdgeUpdate({ closure_recurring_days: nextDays }, selectedEdgeIds);
                                                          }}
                                                      />
                                                      <Label htmlFor={`day-${i}`} className="text-[10px] w-8">{day}</Label>
                                                      
                                                      {isEnabled && (
                                                          <div className="flex items-center gap-1 flex-1">
                                                              <Input 
                                                                  type="time" 
                                                                  className="h-6 text-[10px] p-1"
                                                                  value={daily?.start || firstEdge.closure_recurring_start || ''}
                                                                  onChange={(e) => {
                                                                      const schedule = { ...(firstEdge.closure_daily_schedule || {}) };
                                                                      schedule[i] = { 
                                                                          start: e.target.value, 
                                                                          end: daily?.end || firstEdge.closure_recurring_end || '' 
                                                                      };
                                                                      handleBulkEdgeUpdate({ closure_daily_schedule: schedule }, selectedEdgeIds);
                                                                  }}
                                                              />
                                                              <span className="text-[10px]">-</span>
                                                              <Input 
                                                                  type="time" 
                                                                  className="h-6 text-[10px] p-1"
                                                                  value={daily?.end || firstEdge.closure_recurring_end || ''}
                                                                  onChange={(e) => {
                                                                      const schedule = { ...(firstEdge.closure_daily_schedule || {}) };
                                                                      schedule[i] = { 
                                                                          start: daily?.start || firstEdge.closure_recurring_start || '', 
                                                                          end: e.target.value 
                                                                      };
                                                                      handleBulkEdgeUpdate({ closure_daily_schedule: schedule }, selectedEdgeIds);
                                                                  }}
                                                              />
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })}
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
