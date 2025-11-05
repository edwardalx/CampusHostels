pipeline {
    agent any

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/edwardalx/CampusHostels.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh 'docker build -t campushostels-backend .'
                }
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running automated tests...'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying application...'
            }
        }
    }
}
