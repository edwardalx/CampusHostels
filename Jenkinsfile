pipeline {
    agent any

    environment {
        HOST_IP = "192.168.0.72"
        PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Build and Deploy Frontend') {
            steps {
                withCredentials([sshUserPrivateKey(
                    credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
                    keyFileVariable: 'SSH_KEY',
                    usernameVariable: 'SSH_USERNAME'
                )]) {
                    script {
                        // Create the SSH command as a single quoted string
                        def sshCommand = '''#!/bin/bash
                            echo "=== Frontend Deployment at \$(date) ==="
                            
                            cd ''' + env.PROJECT_DIR + '''
                            
                            # Clean git state but exclude protected directories
                            git checkout -- .
                            git clean -fd -e portainer-data -e ssl -e certbot || true
                            git pull origin main
                            
                            echo "🔨 Building frontend..."
                            cd frontend/campushostel-fe
                            
                            # Clean and build
                            rm -rf node_modules package-lock.json 2>/dev/null || true
                            npm install --force --legacy-peer-deps
                            npm run build
                            
                            # Verify build
                            if [ ! -f "dist/index.html" ]; then
                                echo "❌ Frontend build failed!"
                                exit 1
                            fi
                            
                            echo "✅ Frontend built successfully"
                            echo "Build files:"
                            ls -la dist/
                            
                            # COPY FILES TO DOCKER VOLUME
                            echo "📦 Copying files to Docker volume..."
                            cd ''' + env.PROJECT_DIR + '''
                            
                            # Method 1: Copy to Docker volume mount point
                            DOCKER_VOLUME_PATH="/var/lib/docker/volumes/campushostels_frontend-static/_data"
                            if [ -d "$DOCKER_VOLUME_PATH" ]; then
                                echo "Copying to Docker volume: $DOCKER_VOLUME_PATH"
                                sudo rm -rf "$DOCKER_VOLUME_PATH"/*
                                sudo cp -r frontend/campushostel-fe/dist/* "$DOCKER_VOLUME_PATH/"
                                echo "✅ Files copied to Docker volume"
                            else
                                echo "⚠️ Docker volume not found at $DOCKER_VOLUME_PATH"
                                echo "Trying alternative method..."
                            fi
                            
                            # Method 2: Alternative - restart frontend container to rebuild
                            echo "🔄 Restarting frontend container..."
                            docker compose restart frontend || true
                            
                            # Method 3: Direct nginx restart
                            echo "🔄 Restarting nginx..."
                            docker compose restart nginx || true
                            
                            echo "✅ Frontend deployment completed!"
                            echo "💡 Clear browser cache: Ctrl+Shift+R"
                            echo "🌐 Frontend: https://campushostels.duckdns.org/"
                        '''
                        
                        // Execute the SSH command
                        sh '''
                            cat > /tmp/deploy.sh << 'EOF'
                            ''' + sshCommand + '''
                            EOF
                            
                            chmod +x /tmp/deploy.sh
                            scp -o StrictHostKeyChecking=no -i "$SSH_KEY" /tmp/deploy.sh "$SSH_USERNAME"@''' + env.HOST_IP + ''':/tmp/deploy.sh
                            ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USERNAME"@''' + env.HOST_IP + ''' "bash /tmp/deploy.sh"
                        '''
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Frontend deployed successfully!"
            echo "📢 Clear browser cache: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)"
        }
        failure {
            echo "❌ Frontend deployment failed!"
        }
    }
}