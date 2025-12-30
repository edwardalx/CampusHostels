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
                    script {
                        def sshCommand = """
                            set -e
                            echo "=== Building Frontend at \$(date) ==="
                            
                            cd ${env.PROJECT_DIR}
                            
                            # Discard any local changes without creating a stash
                            git checkout -- .
                            git clean -fd
                            
                            # Pull latest code
                            git pull origin main

                            # Build frontend with retry for rolldown bug
                            cd frontend/campushostel-fe
                            
                            for i in 1 2 3; do
                                echo "Build attempt \\\$i"
                                rm -rf node_modules package-lock.json 2>/dev/null || true
                                
                                if [ \\\$i -eq 1 ]; then
                                    npm install --legacy-peer-deps
                                elif [ \\\$i -eq 2 ]; then
                                    npm install --force --legacy-peer-deps
                                else
                                    # Last attempt: skip optional completely
                                    npm install --no-optional --legacy-peer-deps --ignore-scripts
                                fi
                                
                                if npm run build; then
                                    echo "✅ Build successful on attempt \\\$i"
                                    break
                                elif [ \\\$i -eq 3 ]; then
                                    echo "❌ All build attempts failed"
                                    exit 1
                                else
                                    echo "⚠️ Build failed, retrying..."
                                    sleep 5
                                fi
                            done
                            
                            # Verify build
                            if [ ! -f "dist/index.html" ]; then
                                echo "❌ Build verification failed - no index.html"
                                exit 1
                            fi
                            
                            echo "✅ Frontend built successfully"
                            echo "Build size: \$(du -sh dist/)"
                        """
                        
                        sh """
                            ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '${sshCommand.replace("'", "'\"'\"'")}'
                        """
                    }
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
                    sh """
                        echo "🚀 Deploying using Docker Compose..."

                        ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                            set -e
                            echo "=== Starting Deployment at \$(date) ==="
                            cd ${env.PROJECT_DIR}
                            
                            echo "🔨 Rebuilding Docker images (including frontend)..."
                            # Force rebuild frontend to pick up new build
                            docker compose build --no-cache frontend
                            # Rebuild other services normally
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

                            echo "✅ Deployment completed successfully!"
                        '
                    """
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
                    sh """
                        echo "🌐 Verifying deployment..."
                        
                        ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                            echo "=== Running Containers ==="
                            docker compose ps
                            
                            echo -e "\\\\n=== Frontend Verification ==="
                            echo "Checking frontend files in nginx..."
                            if docker exec campushostels_nginx ls -la /var/www/campushostels-fe/index.html 2>/dev/null; then
                                echo "✅ Frontend files deployed to nginx"
                                echo "File modified: \$(docker exec campushostels_nginx stat -c %y /var/www/campushostels-fe/index.html 2>/dev/null)"
                            else
                                echo "⚠️ Frontend files not found in nginx container"
                                echo "Checking frontend volume..."
                                docker volume inspect campushostels_frontend-static 2>/dev/null || echo "Frontend volume not found"
                            fi
                            
                            echo -e "\\\\n=== Django Health Check ==="
                            docker compose exec -T web python manage.py check 2>&1 | tail -5 || echo "Django check command not available"
                            
                            echo -e "\\\\n=== Service Status ==="
                            echo "Django (web): \$(docker compose ps web | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "PostgreSQL (db): \$(docker compose ps db | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            echo "Frontend container: \$(docker compose ps frontend | grep -q "Up" && echo "✅ Running" || echo "❌ Not running")"
                            
                            echo -e "\\\\n=== Application URLs ==="
                            echo "🌐 Django Admin: https://campushostels.duckdns.org/admin/"
                            echo "🏠 Main Site: https://campushostels.duckdns.org/"
                            echo "🔧 .NET API: https://campushostels.duckdns.org/api/"
                            echo "📅 Frontend built: \$(date -r frontend/campushostel-fe/dist/index.html 2>/dev/null || echo "Unknown")"
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            echo "📊 Deployment process completed"
        }
        success {
            echo "✅ Docker deployment successful!"
            echo "📢 NOTE: Users may need to clear browser cache (Ctrl+Shift+R) to see frontend updates"
        }
        failure {
            echo "❌ Deployment failed!"
            
            withCredentials([sshUserPrivateKey(
                credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                keyFileVariable: 'SSH_KEY',
                usernameVariable: 'SSH_USERNAME'
            )]) {
                sh """
                    echo "=== Debug Information ==="
                    ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
                        cd ${env.PROJECT_DIR}
                        echo "Git status:"
                        git status --short
                        echo ""
                        echo "Recent Docker logs:"
                        docker compose logs --tail=20
                        
                        echo -e "\\\\n=== Frontend Build Status ==="
                        if [ -f "frontend/campushostel-fe/dist/index.html" ]; then
                            echo "✅ Frontend build exists"
                            echo "Build timestamp: \$(stat -c %y frontend/campushostel-fe/dist/index.html)"
                        else
                            echo "❌ Frontend build missing"
                            echo "Checking frontend directory:"
                            ls -la frontend/campushostel-fe/ 2>/dev/null || echo "Cannot access frontend directory"
                        fi
                    '
                """
            }
        }
    }
}