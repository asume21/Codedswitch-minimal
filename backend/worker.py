import os
import time
import traceback
import logging
import redis
from rq import Queue, Connection, Worker
from musicgen_backend import generate_instrumental

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Setup Redis connection and task queue
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
redis_conn = redis.from_url(redis_url)
task_queue = Queue('default', connection=redis_conn)

def update_job_status(job_id, status, **kwargs):
    """Update job status in Redis with additional metadata"""
    update_data = {
        'status': status,
        'updated_at': str(time.time())
    }
    update_data.update(kwargs)
    
    # Clean up None values
    update_data = {k: str(v) for k, v in update_data.items() if v is not None}
    
    # Update Redis
    redis_conn.hset(f"job:{job_id}", mapping=update_data)
    logger.info(f"Job {job_id} status updated to {status}")

def generate_task(job_id, lyrics, prompt, duration):
    """
    Background task to generate audio using MusicGen and store results in Redis.
    
    Args:
        job_id: Unique identifier for the job
        lyrics: Lyrics for the song (used as part of the prompt)
        prompt: Text description of the music to generate
        duration: Duration of the audio in seconds (1-120)
    """
    try:
        logger.info(f"Starting music generation for job {job_id}")
        update_job_status(job_id, 'processing', progress=0)
        
        # Generate the audio file
        wav_path = generate_instrumental(lyrics=lyrics, prompt=prompt, duration=duration)
        
        if not wav_path or not os.path.exists(wav_path):
            raise Exception("Failed to generate audio file - no output was created")
            
        # Update job status with success and file path
        update_job_status(
            job_id,
            'finished',
            filePath=wav_path,
            progress=100,
            file_size=os.path.getsize(wav_path)
        )
        
        logger.info(f"Successfully generated music for job {job_id}: {wav_path}")
        
    except Exception as e:
        error_msg = f"Error in music generation: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        update_job_status(
            job_id,
            'failed',
            error=error_msg,
            error_traceback=traceback.format_exc()
        )
        raise  # Re-raise to mark the job as failed in RQ

if __name__ == '__main__':
    # Worker entrypoint with error handling
    logger.info("Starting RQ worker for music generation tasks")
    
    with Connection(redis_conn):
        worker = Worker(
            [task_queue.name],
            connection=redis_conn,
            default_worker_ttl=600,  # 10 minutes
            job_monitoring_interval=5.0
        )
        
        # Configure worker to handle SIGTERM properly
        worker.work(with_scheduler=True)
