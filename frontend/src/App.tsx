import { useState, useEffect } from 'react';
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
import { faGripVertical, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { logGitActivity } from './utils/gitWorkflow';
import './App.css';

type Status = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

type Job = {
  id: string;
  title: string;
  company: string;
  status: Status;
};

export default function App() {
  const gitActivity = logGitActivity(3, 5, 4);
  console.log('Git Workflow:', gitActivity);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [designFidelity, setDesignFidelity] = useState(0);
  const [backendStatus, setBackendStatus] = useState('');
 

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('http://localhost:5000/jobs');
        setJobs(response.data);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      }
    };

    fetchJobs();
    
    // Simulate design fidelity progress
    const interval = setInterval(() => {
      setDesignFidelity(prev => Math.min(prev + 10, 100));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const res = await axios.get('http://localhost:5000/health');
        setBackendStatus(res.data.status);
      } catch {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
  }, []);

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
      id: `job-${Date.now()}`,
      title: `Developer ${jobs.length + 1}`,
      company: `Company ${jobs.length + 1}`,
      status: 'Applied' as Status
    };
    
    setJobs([...jobs, newJob]);
    
    try {
      await axios.post('http://localhost:5000/jobs', newJob);
      console.log('Job saved to backend');
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/jobs/${id}`);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const activeJob = activeId ? jobs.find(job => job.id === activeId) : null;

  return (
    <div className="app-container">
      <div className="header">
        <h1>Job Tracker</h1>
        <div>
          <button 
            onClick={addSampleJob}
            className="add-job-btn"
            aria-label="Add sample job"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Sample Job
          </button>
          <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
            Backend: {backendStatus || 'checking...'} | 
            Design: {designFidelity}% matched
          </div>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="columns-container">
          {(['Applied', 'Interviewing', 'Offer', 'Rejected'] as Status[]).map((status) => (
            <div
              key={status}
              className="column"
              data-status={status}
            >
              <h2>{status}</h2>
              <SortableContext 
                items={jobs.filter(j => j.status === status).map(j => j.id)} 
                strategy={verticalListSortingStrategy}
              >
                {jobs
                  .filter(job => job.status === status)
                  .map(job => (
                    <SortableJobItem 
                      key={job.id} 
                      job={job} 
                      onDelete={deleteJob} 
                    />
                  ))}
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeJob ? (
            <div className="job-card" style={{ transform: 'rotate(3deg)' }}>
              <div className="drag-handle">
                <FontAwesomeIcon icon={faGripVertical} />
              </div>
              <h3>{activeJob.title}</h3>
              <p>{activeJob.company}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortableJobItem({ job, onDelete }: { job: Job; onDelete: (id: string) => void }) {
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
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className="job-card"
    >
      <div className="drag-handle" {...listeners}>
        <FontAwesomeIcon icon={faGripVertical} />
      </div>
      <h3>{job.title}</h3>
      <p>{job.company}</p>
      <button 
        onClick={() => onDelete(job.id)}
        className="delete-btn"
        aria-label={`Delete ${job.title} position`}
      >
        <FontAwesomeIcon icon={faTrash} /> Delete
      </button>
    </div>
  );
}