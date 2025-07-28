import os
import json
import unittest
from unittest.mock import patch, MagicMock
import tempfile
import shutil

# Add parent directory to path so we can import web_backend
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from web_backend import app, redis_conn, rq_queue

class TestMusicEndpoints(unittest.TestCase):
    def setUp(self):
        """Set up test client and configure app for testing."""
        app.config['TESTING'] = True
        self.client = app.test_client()
        
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        app.config['UPLOAD_FOLDER'] = self.test_dir
        
        # Mock the Redis connection
        self.redis_patcher = patch('web_backend.redis_conn')
        self.mock_redis = self.redis_patcher.start()
        
        # Mock the RQ queue
        self.rq_patcher = patch('web_backend.rq_queue')
        self.mock_queue = self.rq_patcher.start()
        
        # Create a mock job
        self.mock_job = MagicMock()
        self.mock_job.id = 'test-job-123'
        self.mock_job.get_status.return_value = 'queued'
        self.mock_queue.enqueue.return_value = self.mock_job
        
        # Mock the generate_instrumental function
        self.gen_patcher = patch('web_backend.generate_instrumental')
        self.mock_generate = self.gen_patcher.start()
        self.mock_generate.return_value = '/path/to/generated.wav'

    def tearDown(self):
        """Clean up after tests."""
        # Stop all patches
        self.redis_patcher.stop()
        self.rq_patcher.stop()
        self.gen_patcher.stop()
        
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_generate_music_endpoint(self):
        """Test the /api/generate-music endpoint."""
        test_data = {
            'prompt': 'test music',
            'duration': 15,
            'temperature': 0.7
        }
        
        response = self.client.post(
            '/api/generate-music',
            data=json.dumps(test_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 202)
        data = json.loads(response.data)
        self.assertIn('job_id', data)
        self.assertEqual(data['status'], 'queued')
        
        # Verify the job was enqueued
        self.mock_queue.enqueue.assert_called_once()

    def test_music_status_endpoint(self):
        """Test the /api/music-status/<job_id> endpoint."""
        # Mock Redis hgetall to return job data
        self.mock_redis.hgetall.return_value = {
            b'status': b'completed',
            b'file_path': b'/path/to/generated.wav'
        }
        
        response = self.client.get('/api/music-status/test-job-123')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'completed')
        self.assertEqual(data['file_path'], '/path/to/generated.wav')
        
        # Test with non-existent job
        self.mock_redis.hgetall.return_value = {}
        response = self.client.get('/api/music-status/nonexistent-job')
        self.assertEqual(response.status_code, 404)

    def test_music_download_endpoint(self):
        """Test the /api/music-download/<job_id> endpoint."""
        # Create a test file
        test_file = os.path.join(self.test_dir, 'test.wav')
        with open(test_file, 'wb') as f:
            f.write(b'test audio data')
        
        # Mock Redis to return the test file path
        self.mock_redis.hgetall.return_value = {
            b'status': b'completed',
            b'file_path': test_file.encode()
        }
        
        response = self.client.get('/api/music-download/test-job-123')
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'test audio data')
        self.assertEqual(response.content_type, 'audio/wav')
        
        # Test with non-existent file
        self.mock_redis.hgetall.return_value = {
            b'status': b'completed',
            b'file_path': b'/nonexistent/file.wav'
        }
        response = self.client.get('/api/music-download/test-job-123')
        self.assertEqual(response.status_code, 404)

    def test_health_check_endpoint(self):
        """Test the /health endpoint."""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data), {'status': 'healthy'})

    @patch('web_backend.generate_instrumental')
    def test_generate_task_success(self, mock_generate):
        """Test the generate_task function with successful generation."""
        from web_backend import generate_task
        
        test_job_id = 'test-job-123'
        test_prompt = 'test music'
        test_duration = 15
        test_temperature = 0.7
        
        # Configure mock
        mock_generate.return_value = '/path/to/generated.wav'
        
        # Call the task
        result = generate_task(test_job_id, test_prompt, test_duration, test_temperature)
        
        # Verify the result
        self.assertEqual(result, '/path/to/generated.wav')
        
        # Verify the function was called with correct parameters
        mock_generate.assert_called_once_with(
            prompt=test_prompt,
            duration=test_duration,
            temperature=test_temperature
        )
        
        # Verify Redis was updated
        self.mock_redis.hset.assert_any_call(
            f'musicgen:{test_job_id}',
            'status',
            'completed'
        )
        self.mock_redis.hset.assert_any_call(
            f'musicgen:{test_job_id}',
            'file_path',
            '/path/to/generated.wav'
        )


if __name__ == '__main__':
    unittest.main()
