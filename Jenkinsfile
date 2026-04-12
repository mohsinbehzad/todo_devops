pipeline {
    agent any

    environment {
        DEPLOY_DIR = '/var/lib/jenkins/todoapp-p2'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Pulling latest code from GitHub...'
                git branch: 'main',
                    url: 'https://github.com/mohsinbehzad/todo_devops.git'
            }
        }

        stage('Deploy Part 2') {
            steps {
                echo 'Deploying with Docker Compose...'
                sh '''
                    cd ${DEPLOY_DIR}
                    docker compose -f docker-compose.part2.yml pull
                    docker compose -f docker-compose.part2.yml down
                    docker compose -f docker-compose.part2.yml up -d
                    docker ps --filter "name=todo"
                '''
            }
        }

        stage('Verify') {
            steps {
                sh '''
                    sleep 8
                    curl -f http://localhost:8081/health || echo "Check logs"
                '''
            }
        }
    }

    post {
        success { echo '✅ TaskFlow deployed on port 8081!' }
        failure { echo '❌ Deployment failed. Check console output.' }
    }
}
