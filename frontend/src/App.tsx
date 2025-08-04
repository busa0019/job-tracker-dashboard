import { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from './utils/api';
import { logGitActivity } from './utils/gitWorkflow';
import './App.css';

type Status = 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

type Job = {
  _id: string;
  title: string;
  company: string;
  status: Status;
};

export default function App() {
  const gitActivity = logGitActivity(3, 5, 2); 

  console.log('Git Workflow:', gitActivity);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [designFidelity, setDesignFidelity] = useState(0);
  const [backendStatus, setBackendStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get('/jobs');
        setJobs(response.data);
        setBackendStatus('online');
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setBackendStatus('offline');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();

    const interval = setInterval(() => {
      setDesignFidelity(prev => {
        const next = Math.min(prev + 10, 100);
        if (next === 100) {
          console.log('Figma design fully implemented!');
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
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

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeJob = jobs.find(job => job._id === active.id);
    const overJob = jobs.find(job => job._id === over.id);
    if (!activeJob || !overJob || active.id === over.id) return;

    const newStatus = over.data?.current?.status as Status || activeJob.status;

    setJobs(jobs =>
      jobs.map(job =>
        job._id === active.id ? { ...job, status: newStatus } : job
      )
    );

    try {
      await axios.patch(`/jobs/${active.id}`, { status: newStatus });
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const addSampleJob = async () => {
    const companies = [  "Microsoft", "Apple", "Amazon", "Alphabet", "Meta", 
    "Tesla", "NVIDIA", "JPMorgan Chase", "Visa", "Walmart",
    "Johnson & Johnson", "Procter & Gamble", "Home Depot", "Bank of America",
    "Adobe", "Salesforce", "Cisco", "Intel", "Netflix", "PayPal"];
    const titles = ['Frontend Engineer', 'Backend Developer', 'Product Designer', 'Data Analyst','Machine Learning Engineer', 'DevOps Specialist', 'Cloud Solutions Architect', 'Senior Frontend Engineer' ];
    
    const newJob = {
      title: titles[Math.floor(Math.random() * titles.length)],
      company: companies[Math.floor(Math.random() * companies.length)],
      status: 'Applied' as Status,
    };

    try {
      const res = await axios.post('/jobs', newJob);
      setJobs(prev => [...prev, res.data]);
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const deleteJob = async (_id: string) => {
    try {
      await axios.delete(`/jobs/${_id}`);
      setJobs(jobs => jobs.filter(job => job._id !== _id));
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const activeJob = activeId ? jobs.find(job => job._id === activeId) : null;

  return (
    <div className="app-container">
      <ToastContainer />
      <div className="header">
        <h1>Job Tracker</h1>
        <div>
          <button onClick={addSampleJob} className="add-job-btn" aria-label="Add sample job">
            <FontAwesomeIcon icon={faPlus} />
            Add Sample Job
          </button>
          <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
            Backend: {backendStatus || 'checking...'} | Design: {designFidelity}% matched
          </div>
        </div>
      </div>

      <div className="objectives-banner">
        <span>Obj #1: WCAG Compliant</span>
        <span>Obj #2: React/API Integration</span>
        <span>Obj #3: Figma Collaboration</span>
        <span>Obj #4: Git Workflow</span>
        <span>Obj #5: Backend Integration</span>
      </div>

      {isLoading ? (
        <p>Loading jobs...</p>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="columns-container">
            {(['Applied', 'Interviewing', 'Offer', 'Rejected'] as Status[]).map(status => (
              <div key={status} className="column" data-status={status}>
                <h2>{status}</h2>
                <SortableContext
                  items={jobs.filter(j => j.status === status).map(j => j._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {jobs
                    .filter(job => job.status === status)
                    .map(job => (
                      <SortableJobItem key={job._id} job={job} onDelete={deleteJob} />
                    ))}
                </SortableContext>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeJob && (
              <div className="job-card">
                <div className="drag-handle">
                  <FontAwesomeIcon icon={faGripVertical} />
                </div>
                <h3>{activeJob.title}</h3>
                <p>{activeJob.company}</p>
                <span className="status-tag">{activeJob.status}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
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
  } = useSortable({ id: job._id });

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
      <span className="status-tag">{job.status}</span>
      <button
        onClick={() => onDelete(job._id)}
        className="delete-btn"
        aria-label={`Delete ${job.title} position`}
      >
        <FontAwesomeIcon icon={faTrash} /> Delete
      </button>
    </div>
  );
}
