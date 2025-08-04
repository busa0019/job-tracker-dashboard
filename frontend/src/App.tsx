import { useState } from 'react';
import { 
  DndContext, 
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faPlus } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

type Status = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

type Job = {
  id: string;
  title: string;
  company: string;
  status: Status;
};

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: '1', title: 'Frontend Dev', company: 'Tech Co', status: 'Applied' }
  ]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: { active: { id: UniqueIdentifier } }) => {
    setActiveId(event.active.id);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeJob = jobs.find(job => job.id === active.id);
    const overJob = jobs.find(job => job.id === over.id);

    if (!activeJob || !overJob || active.id === over.id) return;

    // Get status from drop target
    const newStatus = over.data?.current?.status as Status || activeJob.status;

    setJobs(jobs => {
      const jobIndex = jobs.findIndex(j => j.id === active.id);
      const updatedJob = { ...jobs[jobIndex], status: newStatus };
      
      return jobs.map(job => 
        job.id === active.id ? updatedJob : job
      );
    });
  };

  const addSampleJob = async () => {
    const newJob = {
      id: String(jobs.length + 1),
      title: `Job ${jobs.length + 1}`,
      company: `Company ${jobs.length + 1}`,
      status: 'Applied' as Status
    };
    
    setJobs([...jobs, newJob]);
    
    try {
      // Connect to your backend
      await axios.post('http://localhost:5000/jobs', newJob);
      console.log('Job saved to backend');
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const activeJob = activeId ? jobs.find(job => job.id === activeId) : null;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#4361ee', margin: 0 }}>Job Tracker</h1>
        <button 
          onClick={addSampleJob}
          style={{
            background: '#4361ee',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Sample Job
        </button>
      </div>
      
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
          {(['Applied', 'Interviewing', 'Offer', 'Rejected'] as Status[]).map((status) => (
            <div
              key={status}
              style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                minWidth: '250px',
                flex: 1
              }}
              data-status={status}
            >
              <h2 style={{ marginTop: 0 }}>{status}</h2>
              <SortableContext 
                items={jobs.filter(j => j.status === status).map(j => j.id)} 
                strategy={verticalListSortingStrategy}
              >
                {jobs
                  .filter(job => job.status === status)
                  .map(job => (
                    <SortableJobItem key={job.id} job={job} />
                  ))}
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeJob ? (
            <div style={{
              background: 'white',
              padding: '12px',
              borderRadius: '4px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              cursor: 'grabbing',
              transform: 'rotate(3deg)',
              width: '240px'
            }}>
              <div>
                <FontAwesomeIcon icon={faGripVertical} />
              </div>
              <h3 style={{ margin: '8px 0' }}>{activeJob.title}</h3>
              <p style={{ margin: 0 }}>{activeJob.company}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortableJobItem({ job }: { job: Job }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: 'white',
    padding: '12px',
    margin: '8px 0',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} style={{ marginBottom: '8px', color: '#666' }}>
        <FontAwesomeIcon icon={faGripVertical} />
      </div>
      <h3 style={{ margin: '4px 0' }}>{job.title}</h3>
      <p style={{ margin: 0 }}>{job.company}</p>
    </div>
  );
}