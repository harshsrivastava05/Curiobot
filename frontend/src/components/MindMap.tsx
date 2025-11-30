"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Types
type MindTree = { name: string; children?: MindTree[] };

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Root' } },
];
const initialEdges: Edge[] = [];

export default function MindMap({ data }: { data: MindTree }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Transform hierarchical data to React Flow nodes/edges
  useEffect(() => {
    if (!data) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let nodeId = 1;

    const traverse = (node: MindTree, parentId: string | null, x: number, y: number, level: number) => {
      const currentId = parentId ? `${parentId}-${nodeId++}` : 'root';
      
      newNodes.push({
        id: currentId,
        position: { x, y },
        data: { label: node.name },
        style: { 
          background: '#e0e5ec', 
          border: '1px solid #fff', 
          borderRadius: '12px',
          padding: '10px 20px',
          boxShadow: '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
          color: '#4a5568',
          fontWeight: 'bold',
          width: 180,
          textAlign: 'center'
        },
      });

      if (parentId) {
        newEdges.push({
          id: `e${parentId}-${currentId}`,
          source: parentId,
          target: currentId,
          animated: true,
          style: { stroke: '#667eea' },
        });
      }

      if (node.children) {
        const totalWidth = node.children.length * 250;
        let startX = x - totalWidth / 2 + 125;
        
        node.children.forEach((child) => {
          traverse(child, currentId, startX, y + 150, level + 1);
          startX += 250;
        });
      }
    };

    traverse(data, null, 0, 0, 0);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
