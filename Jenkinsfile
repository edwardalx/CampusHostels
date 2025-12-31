// // Jenkinsfile.full - Full Deployment (All Services)
// // Use this when you need to update backend, migrations, or all services
// pipeline {
//     agent any

//     environment {
//         HOST_IP = "192.168.0.72"
//         PROJECT_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
//     }

//     stages {
//         stage('Checkout and Update') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 set -e
//                                 echo "=== Full Deployment Started at \$(date) ==="
                                
//                                 cd ${env.PROJECT_DIR}
                                
//                                 echo "📦 Pulling latest code..."
//                                 git stash || echo "No changes to stash"
//                                 git pull origin main
                                
//                                 echo "✅ Code updated"
//                             '
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Build Frontend') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 set -e
//                                 echo "🔨 Building frontend..."
                                
//                                 cd ${env.PROJECT_DIR}/frontend/campushostel-fe
                                
//                                 echo "🧹 Cleaning..."
//                                 rm -rf node_modules package-lock.json dist
                                
//                                 echo "📦 Installing dependencies..."
//                                 npm install --force --legacy-peer-deps
                                
//                                 echo "🏗️ Building..."
//                                 npm run build
                                
//                                 if [ ! -f "dist/index.html" ]; then
//                                     echo "❌ Frontend build failed!"
//                                     exit 1
//                                 fi
                                
//                                 echo "✅ Frontend built"
//                             '
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Rebuild Docker Images') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 set -e
//                                 echo "🐳 Rebuilding Docker images..."
                                
//                                 cd ${env.PROJECT_DIR}
//                                 docker compose build
                                
//                                 echo "✅ Docker images rebuilt"
//                             '
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Restart Services') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 set -e
//                                 echo "🔄 Restarting services..."
                                
//                                 cd ${env.PROJECT_DIR}
//                                 docker compose down
//                                 docker compose up -d
                                
//                                 echo "⏳ Waiting for services to start..."
//                                 sleep 30
                                
//                                 echo "✅ Services restarted"
//                             '
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Django Setup') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 set -e
//                                 echo "🐍 Running Django setup..."
                                
//                                 cd ${env.PROJECT_DIR}
                                
//                                 echo "🗄️ Applying migrations..."
//                                 docker compose exec -T web python manage.py migrate --noinput || echo "⚠️ Migrations warning"
                                
//                                 echo "📁 Collecting static files..."
//                                 docker compose exec -T web python manage.py collectstatic --noinput --clear || echo "⚠️ Static files warning"
                                
//                                 echo "✅ Django setup completed"
//                             '
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Deploy Frontend Files') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 set -e
//                                 echo "📦 Deploying frontend files..."
                                
//                                 cd ${env.PROJECT_DIR}
                                
//                                 # Copy to nginx container
//                                 docker cp frontend/campushostel-fe/dist/. campushostels_nginx:/var/www/campushostels-fe/
                                
//                                 # Set permissions
//                                 docker exec campushostels_nginx chown -R nginx:nginx /var/www/campushostels-fe/ 2>/dev/null || true
                                
//                                 echo "🔄 Reloading nginx..."
//                                 docker exec campushostels_nginx nginx -s reload 2>/dev/null || echo "⚠️ Nginx reload warning"
                                
//                                 echo "✅ Frontend files deployed"
//                             '
//                         """
//                     }
//                 }
//             }
//         }

//         stage('Verify Deployment') {
//             steps {
//                 withCredentials([sshUserPrivateKey(
//                     credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                     keyFileVariable: 'SSH_KEY',
//                     usernameVariable: 'SSH_USERNAME'
//                 )]) {
//                     script {
//                         sh """
//                             ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                                 echo "=== Verification at \$(date) ==="
                                
//                                 cd ${env.PROJECT_DIR}
                                
//                                 echo "=== Container Status ==="
//                                 docker compose ps
                                
//                                 echo -e "\\\\n=== Services Health ==="
//                                 echo "Django: \$(docker compose exec -T web python manage.py check 2>&1 | tail -1 || echo "Check failed")"
//                                 echo "PostgreSQL: \$(docker compose exec -T db pg_isready 2>/dev/null && echo "✅" || echo "❌")"
//                                 echo "Nginx: \$(docker compose ps nginx | grep -q "Up" && echo "✅" || echo "❌")"
                                
//                                 echo -e "\\\\n=== Frontend Status ==="
//                                 echo "Files in nginx: \$(docker exec campushostels_nginx ls /var/www/campushostels-fe/index.html >/dev/null 2>&1 && echo "✅" || echo "❌")"
                                
//                                 echo -e "\\\\n=== API Test ==="
//                                 echo "API response: \$(curl -s -o /dev/null -w "%{http_code}" https://localhost/api/Properties 2>/dev/null || echo "Failed")"
                                
//                                 echo -e "\\\\n=== URLs ==="
//                                 echo "🌐 Main Site: https://campushostels.duckdns.org/?v=\$(date +%s)"
//                                 echo "🔧 API Docs: https://campushostels.duckdns.org/swagger"
//                                 echo "👨‍💼 Admin: https://campushostels.duckdns.org/admin/"
//                             '
//                         """
//                     }
//                 }
//             }
//         }
//     }

//     post {
//         always {
//             echo "📊 Full deployment pipeline completed"
//         }
//         success {
//             echo "✅ Full deployment successful!"
//             echo "🚀 All services are running and updated"
//         }
//         failure {
//             echo "❌ Full deployment failed!"
            
//             withCredentials([sshUserPrivateKey(
//                 credentialsId: 'be7af895-440a-4af4-ad0a-685416674053',
//                 keyFileVariable: 'SSH_KEY',
//                 usernameVariable: 'SSH_USERNAME'
//             )]) {
//                 script {
//                     sh """
//                         echo "=== Debug Information ==="
//                         ssh -o StrictHostKeyChecking=no -i "\$SSH_KEY" "\$SSH_USERNAME"@${env.HOST_IP} '
//                             cd ${env.PROJECT_DIR}
//                             echo "=== Recent Logs ==="
//                             docker compose logs --tail=30
//                             echo -e "\\\\n=== Container Status ==="
//                             docker ps -a
//                             echo -e "\\\\n=== Failed Stage Debug ==="
//                             echo "Last 5 commands:"
//                             history 5 2>/dev/null || echo "History not available"
//                         '
//                     """
//                 }
//             }
//         }
//     }
// }