module "static_module" {
  source = "./static/"
}

variable "container_name" {
  description = "Name of the ECS docker container"
  type        = string
  default     = "conversation_bot_container_tf"
}

variable "ecs_service_name" {
  description = "Name of the ECS service"
  type        = string
  default     = "conversation_bot_service_tf"
}

resource "null_resource" "docker_image_push" {
  provisioner "local-exec" {
    command = <<EOT
      echo ${module.static_module.ecr_authorization_token} | base64 --decode | cut -d':' -f2 | docker login --username AWS --password-stdin ${module.static_module.ecr_repository_url}
      docker build -t ${module.static_module.ecr_repository_url}:latest ../
      docker push ${module.static_module.ecr_repository_url}:latest
    EOT
  }
  depends_on = [ module.static_module.ecr_repository ]
}

resource "aws_ecs_task_definition" "ecs_task_definition" {
  family                   = "conversation_bot_tf"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  task_role_arn            = "arn:aws:iam::223658162111:role/ecsTaskExecutionRole"
  execution_role_arn       = "arn:aws:iam::223658162111:role/ecsTaskExecutionRole"
  cpu                      = 1024
  memory                   = 2048
  
  container_definitions    = jsonencode(
  [
    {
      "name": "${var.container_name}",
      "image": "${module.static_module.ecr_repository_url}:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        },
        {
          "containerPort": 8080,
          "hostPort": 8080,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:8080/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
      "memoryReservation": 32,
      "cpu": 1,
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "${module.static_module.log_group_name}",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "OPEN_API_KEY",
          "value": "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"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ]
    }
  ]
  )
  depends_on = [ module.static_module.ecr_repository,  module.static_module.log_group ]
}

resource "aws_ecs_service" "ecs_service" {
  name            = var.ecs_service_name
  cluster         = module.static_module.ecs_cluster_id
  task_definition = aws_ecs_task_definition.ecs_task_definition.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  scheduling_strategy = "REPLICA"

  network_configuration {
    security_groups = [module.static_module.ecs_load_balancer_sg_id]
    subnets         = module.static_module.ecs_subnet_ids
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = module.static_module.ecs_target_group_arn
    container_name   = var.container_name
    container_port   = 8080
  }

  depends_on = [ aws_ecs_task_definition.ecs_task_definition, module.static_module.ecs_cluster, module.static_module.load_balancer,  module.static_module.target_group, module.static_module.listener]
}
