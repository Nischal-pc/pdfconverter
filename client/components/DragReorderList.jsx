'use client';
import { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

function SortableItem({ id, label }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        animate={{ scale: isDragging ? 1.02 : 1, boxShadow: isDragging ? '0 8px 32px rgba(99,102,241,0.3)' : 'none' }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: isDragging ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          border: `1px solid ${isDragging ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
          borderRadius: 12, cursor: 'grab', userSelect: 'none',
        }}
        {...attributes}
        {...listeners}
      >
        <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>⠿</div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
      </motion.div>
    </div>
  );
}

export default function DragReorderList({ items, onChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
