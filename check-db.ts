import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: nodes, error: nodesError } = await supabase.from('map_nodes').select('*')
  const { data: edges, error: edgesError } = await supabase.from('map_edges').select('*')

  if (nodesError) console.error('Nodes error:', nodesError)
  if (edgesError) console.error('Edges error:', edgesError)

  console.log(`Nodes count: ${nodes?.length ?? 0}`)
  console.log(`Edges count: ${edges?.length ?? 0}`)
  
  if (nodes && nodes.length > 0) {
    console.log('Sample node:', nodes[0])
  }
}

check()
