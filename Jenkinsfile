pipeline {
    agent any

    environment {
        SERVER_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels/backend-admin"
        VENV_PATH = "/home/eobkwaku/venv"
        HOST_IP = "192.168.0.72"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/edwardalx/CampusHostels.git'
            }
        }

        stage('Deploy to Production') {
            steps {
                sh """
                    echo "🚀 DEPLOYING TO ACTUAL PRODUCTION SYSTEM"
                    
                    ssh -o StrictHostKeyChecking=no eobkwaku@${env.HOST_IP} '
                        echo "📦 Pulling latest code..."
                        cd /home/eobkwaku/jenkins-docker/CampusHostels
                        git pull origin main
                        
                        echo "📦 Installing dependencies..."
                        source ${env.VENV_PATH}/bin/activate
                        cd ${env.SERVER_DIR}
                        pip install -r requirements.txt
                        
                        echo "🗄️ Running database migrations..."
                        python manage.py migrate
                        
                        echo "📁 Collecting static files..."
                        python manage.py collectstatic --noinput
                        
                        echo "🔄 Restarting production services..."
                        sudo systemctl restart gunicorn
                        sudo systemctl reload nginx
                        
                        echo "✅ SUCCESS! Code deployed to ACTUAL PRODUCTION!"
                    '
                """
            }
        }

        stage('Verify Production Deployment') {
            steps {
                sh """
                    echo "=== PRODUCTION VERIFICATION ==="
                    ssh -o StrictHostKeyChecking=no eobkwaku@${env.HOST_IP} '
                        echo ""
                        echo "📊 Gunicorn Status:"
                        sudo systemctl status gunicorn --no-pager | head -5
                        echo ""
                        echo "🌐 Production Site Test:"
                        curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost/admin
                        echo ""
                        echo "🎯 PRODUCTION URL: http://hostels.bookshelfgh.duckdns.org/admin"
                        echo "✅ Code changes are now LIVE!"
                    '
                """
            }
        }
    }

    post {
        success {
            echo "🎉 SUCCESS! PRODUCTION DEPLOYMENT COMPLETE!"
            echo "👀 Users can now see changes at: http://hostels.bookshelfgh.duckdns.org"
        }
        failure {
            echo "❌ Production deployment failed"
        }
    }
}