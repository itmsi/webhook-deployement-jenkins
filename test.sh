# Test script untuk webhook deployment

echo "🧪 Testing Webhook Deployment System"
echo "===================================="

# Base URL
BASE_URL="http://localhost:9522"

# Test health check
echo "1. Testing health check..."
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"

echo ""

# Test get projects
echo "2. Testing get projects..."
curl -s "$BASE_URL/webhook/projects" | jq '.' || echo "❌ Get projects failed"

echo ""

# Test specific project (ganti dengan project yang ada di config.env)
PROJECT_NAME="sistem-a"
echo "3. Testing project configuration for $PROJECT_NAME..."
curl -s -X POST "$BASE_URL/webhook/test/$PROJECT_NAME" | jq '.' || echo "❌ Test project failed"

echo ""

# Test deployment (ganti dengan project yang ada di config.env)
echo "4. Testing deployment for $PROJECT_NAME..."
curl -s -X POST "$BASE_URL/webhook/deploy/$PROJECT_NAME" \
  -H "Content-Type: application/json" \
  -d '{"branch": "develop", "commit": "test123", "buildNumber": "1"}' | jq '.' || echo "❌ Deployment test failed"

echo ""
echo "✅ Testing selesai!"
echo "📖 Lihat output di atas untuk hasil testing"
