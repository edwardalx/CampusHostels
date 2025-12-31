pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                url: 'https://github.com/edwardalx/CampusHostels.git'
            }
        }

        stage('Build Frontend') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh '''
                        echo "🔨 Building frontend..."
                        
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@'"$HOST_IP"' '
                        set -e
                        cd '"$PROJECT_DIR"'
                        
                        echo "📦 Pulling latest frontend code..."
                        cd frontend/campushostel-fe
                        
                        echo "🧹 Cleaning node modules..."
                        rm -rf node_modules package-lock.json 2>/dev/null || true
                        
                        echo "📦 Installing dependencies..."
                        npm install --force --legacy-peer-deps
                        
                        echo "🏗️ Building frontend..."
                        npm run build
                        
                        if [ ! -f "dist/index.html" ]; then
                            echo "❌ Frontend build failed!"
                            exit 1
                        fi
                        
                        echo "✅ Frontend built successfully!"
                        '
                    '''
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh '''
                        echo "🚀 Deploying using Docker Compose..."

                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@'"$HOST_IP"' '
                        set -e  # Exit on any error
                        echo "📦 Pulling latest repository…"
                        cd '"$PROJECT_DIR"'
                        
                        # Stash any local changes
                        git stash || echo "No changes to stash"
                        git pull origin main

                        echo "🔨 Rebuilding images…"
                        docker compose build

                        echo "🔄 Restarting services…"
                        docker compose down
                        docker compose up -d

                        echo "⏳ Waiting for services to start (30 seconds)…"
                        sleep 30

                        echo "🗄️ Applying Django migrations…"
                        docker compose exec -T web python manage.py migrate --noinput || echo "⚠️ Migrations may have warnings"

                        echo "📁 Collecting static files…"
                        docker compose exec -T web python manage.py collectstatic --noinput --clear || echo "⚠️ Static collection may have warnings"
                        
                        echo "📦 Deploying frontend files..."
                        # Option 1: Copy directly to nginx container (RELIABLE)
                        echo "Copying frontend to nginx container at /var/www/campushostels-fe/..."
                        docker cp frontend/campushostel-fe/dist/. campushostels_nginx:/var/www/campushostels-fe/
                        
                        # Set correct permissions
                        docker exec campushostels_nginx chown -R nginx:nginx /var/www/campushostels-fe/ 2>/dev/null || echo "Permissions already set"
                        
                        # Option 2: Also update frontend container if it exists
                        docker cp frontend/campushostel-fe/dist/. campushostels-frontend-1:/usr/share/nginx/html/ 2>/dev/null || echo "Frontend container update skipped"
                        
                        echo "✅ Frontend files deployed"
                        
                        echo "🔄 Reloading nginx..."
                        docker exec campushostels_nginx nginx -s reload 2>/dev/null || echo "⚠️ Nginx reload failed, continuing..."

                        echo "✅ Deployment completed successfully!"
                        '
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    sh '''
                        echo "🌐 Verifying deployment..."
                        
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@'"$HOST_IP"' '
                        cd '"$PROJECT_DIR"'
                        
                        echo "=== Running Containers ==="
                        docker compose ps
                        
                        echo -e "\\n=== Django Health Check ==="
                        docker compose exec -T web python manage.py check 2>&1 | tail -5 || echo "Django check command not available"
                        
                        echo -e "\\n=== Service Status ==="
                        echo "Django (web): $(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                        echo "PostgreSQL (db): $(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                        echo "Nginx: $(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                        
                        echo -e "\\n=== Frontend Status ==="
                        if docker exec campushostels_nginx ls /var/www/campushostels-fe/index.html >/dev/null 2>&1; then
                            echo "Frontend files in nginx: ✅ Found"
                            echo "File list in /var/www/campushostels-fe/:"
                            docker exec campushostels_nginx ls -la /var/www/campushostels-fe/
                            echo -e "\\nIndex.html timestamp: $(docker exec campushostels_nginx stat -c "%y" /var/www/campushostels-fe/index.html)"
                        else
                            echo "Frontend files in nginx: ❌ Not found"
                        fi
                        
                        echo -e "\\n=== Local Build Info ==="
                        echo "Local build timestamp: $(stat -c "%y" frontend/campushostel-fe/dist/index.html 2>/dev/null || echo "No local build found")"
                        
                        echo -e "\\n=== Quick Health Check ==="
                        echo "API test: $(curl -s -o /dev/null -w "%{http_code}" https://localhost/api/Properties 2>/dev/null || echo "Failed")"
                        
                        echo -e "\\n=== Application URLs ==="
                        echo "🌐 Django Admin: https://campushostels.duckdns.org/admin/"
                        echo "🏠 Main Site: https://campushostels.duckdns.org/"
                        echo "🔧 .NET API: https://campushostels.duckdns.org/api/"
                        echo "🔍 Test URL (cache busting): https://campushostels.duckdns.org/?v=$(date +%s)"
                        '
                    '''
                }
            }
        }
        
        stage('Clear Browser Cache Hint') {
            steps {
                echo '''
                🔄 Browser Cache Clearing Instructions:
                1. Open Dev Tools (F12)
                2. Go to Network tab
                3. Check "Disable cache"
                4. Right-click refresh → "Empty Cache and Hard Reload"
                5. Or use incognito/private window
                
                Test URL: https://campushostels.duckdns.org/?v=$(date +%s)
                '''
            }
        }
    }

    post {
        always {
            echo "📊 Deployment process completed"
        }
        success {
            echo "✅ Docker deployment successful!"
            
            // Additional success notification
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh '''
                    echo "=== Final Verification ==="
                    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@'"$HOST_IP"' '
                    cd '"$PROJECT_DIR"'
                    echo "Checking frontend file freshness..."
                    LOCAL_TIME=$(stat -c "%Y" frontend/campushostel-fe/dist/index.html)
                    CONTAINER_TIME=$(docker exec campushostels_nginx stat -c "%Y" /var/www/campushostels-fe/index.html 2>/dev/null || echo 0)
                    
                    if [ "$LOCAL_TIME" = "$CONTAINER_TIME" ]; then
                        echo "✅ Frontend files are up-to-date"
                    else
                        echo "⚠️ Frontend files may be outdated"
                        echo "   Local: $(stat -c "%y" frontend/campushostel-fe/dist/index.html)"
                        echo "   Container: $(docker exec campushostels_nginx stat -c "%y" /var/www/campushostels-fe/index.html 2>/dev/null || echo "Not found")"
                    fi
                    '
                '''
            }
        }
        failure {
            echo "❌ Deployment failed!"
            
            // Debugging info on failure
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh '''
                    echo "=== Debug Information ==="
                    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@'"$HOST_IP"' '
                    cd '"$PROJECT_DIR"'
                    echo "Recent container logs:"
                    docker compose logs --tail=50 2>/dev/null || echo "No logs available"
                    
                    echo -e "\\n=== Container Status ==="
                    docker ps -a | grep -E "(campushostels|nginx|frontend)" || echo "No relevant containers"
                    
                    echo -e "\\n=== Frontend Files Check ==="
                    echo "Local:"
                    ls -la frontend/campushostel-fe/dist/ 2>/dev/null || echo "No local build"
                    echo -e "\\nNginx container:"
                    docker exec campushostels_nginx ls -la /var/www/campushostels-fe/ 2>/dev/null || echo "Cannot access nginx"
                    '
                '''
            }
        }
    }
}