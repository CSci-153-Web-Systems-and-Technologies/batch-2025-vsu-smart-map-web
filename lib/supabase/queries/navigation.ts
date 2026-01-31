import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../browser-client";
import type { MapNode, MapEdge } from "@/lib/types/graph";

type MaybeClient = SupabaseClient | Promise<SupabaseClient>;

const resolveClient = async (client?: MaybeClient) =>
  Promise.resolve(client ?? getSupabaseBrowserClient());

export async function getMapNodes(client?: MaybeClient) {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("map_nodes")
    .select("*");
  
  return { data: data as MapNode[] | null, error };
}

export async function getMapEdges(client?: MaybeClient) {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("map_edges")
    .select("*");
    
  return { data: data as MapEdge[] | null, error };
}

export async function saveMapGraph(
  nodes: MapNode[], 
  edges: MapEdge[], 
  client?: MaybeClient
) {
  const supabase = await resolveClient(client);
  
  const { error: deleteEdgesError } = await supabase.from("map_edges").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteEdgesError) return { error: deleteEdgesError };
  
  const { error: deleteNodesError } = await supabase.from("map_nodes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteNodesError) return { error: deleteNodesError };
  
  if (nodes.length > 0) {
    const { error: insertNodesError } = await supabase.from("map_nodes").insert(nodes);
    if (insertNodesError) return { error: insertNodesError };
  }
  
  if (edges.length > 0) {
    const { error: insertEdgesError } = await supabase.from("map_edges").insert(edges);
    if (insertEdgesError) return { error: insertEdgesError };
  }
  
  return { error: null };
}
