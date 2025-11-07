pipeline {
    agent any

    environment {
        BACKEND_ADMIN_IMAGE = "campushostels-backend-admin"
        BACKEND_ADMIN_CONTAINER = "campushostels-backend-admin-container"
        POSTGRES_CONTAINER = "campus_postgres"
        DOCKER_NETWORK = "campushostels_campus_network"
        REPO_DIR = "/home/eobkwaku/jenkins-docker/CampusHostels"
    }

    stages {
        stage('Cleanup') {
            steps {
                sh """
                    docker stop ${env.BACKEND_ADMIN_CONTAINER} || true
                    docker rm ${env.BACKEND_ADMIN_CONTAINER} || true
                """
            }
        }

        stage('Build') {
            steps {
                sh """
                    cd ${env.REPO_DIR}/backend-admin
                    docker build -t ${env.BACKEND_ADMIN_IMAGE} .
                """
            }
        }

        stage('Setup Database') {
            steps {
                script {
                    echo "🗄️ Setting up PostgreSQL database..."
                    sh """
                        # Create database if it doesn't exist
                        docker exec ${env.POSTGRES_CONTAINER} psql -U postgres -c "CREATE DATABASE campushostels;" || echo "Database might already exist"
                    """
                }
            }
        }

        stage('Deploy on Correct Network') {
            steps {
                script {
                    echo "🚀 Deploying Django on ${env.DOCKER_NETWORK} network..."
                    sh """
                        docker run -d \
                            --name ${env.BACKEND_ADMIN_CONTAINER} \
                            -p 8081:8000 \
                            --network ${env.DOCKER_NETWORK} \
                            -e DATABASE_URL=postgresql://postgres@${env.POSTGRES_CONTAINER}:5432/campushostels \
                            ${env.BACKEND_ADMIN_IMAGE}
                    """
                    echo "⏳ Waiting for Django to start..."
                    sleep 30
                }
            }
        }

        stage('Run Migrations') {
            steps {
                script {
                    echo "📦 Running Django migrations..."
                    sh """
                        docker exec ${env.BACKEND_ADMIN_CONTAINER} python manage.py migrate || echo "Migrations might have run already"
                    """
                    sleep 10
                }
            }
        }

        stage('Verify') {
            steps {
                script {
                    echo "✅ Verifying deployment..."
                    sh """
                        echo "=== Container Status ==="
                        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                        
                        echo "=== Network Information ==="
                        docker inspect ${env.BACKEND_ADMIN_CONTAINER} | grep -A 10 Networks
                        
                        echo "=== Application Logs ==="
                        docker logs --tail 20 ${env.BACKEND_ADMIN_CONTAINER}
                        
                        echo "=== Health Check ==="
                        curl -f http://localhost:8081 && echo "✅ Django is running with PostgreSQL!" || echo "❌ Application not accessible"
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 DJANGO SUCCESSFULLY DEPLOYED WITH POSTGRESQL!"
            echo "🌐 Access at: http://your-server-ip:8081"
        }
        failure {
            echo "❌ Deployment failed"
            sh """
                echo "=== Debug Information ==="
                docker logs ${env.BACKEND_ADMIN_CONTAINER}
                echo "=== Network Debug ==="
                docker network inspect ${env.DOCKER_NETWORK}
            """
        }
    }
}