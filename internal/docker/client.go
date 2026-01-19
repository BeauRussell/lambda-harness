package docker

import (
	"context"
	"fmt"
	"io"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

type Service struct {
	client *client.Client
}

func NewService() (*Service, error) {
	cli, err := client.New(client.FromEnv)
	if err != nil {
		return nil, fmt.Errorf("Failed to create Docker client: %w", err)
	}

	return &Service{client: cli}, nil
}

func (s *Service) Close() error {
	return s.client.Close()
}

func (s *Service) PullImage(ctx context.Context, image string) error {
	pullResponse, err := s.client.ImagePull(ctx, image, client.ImagePullOptions{})
	if err != nil {
		return fmt.Errorf("Failed to start image pull %s: %w", image, err)
	}
	defer pullResponse.Close()

	_, err = io.Copy(io.Discard, pullResponse)
	if err != nil {
		return fmt.Errorf("Failed to pull image %s: %w", image, err)
	}

	return nil
}

func (s *Service) CreateContainer(ctx context.Context, name, image string) (string, error) {
	createOptions := client.ContainerCreateOptions{
		Config: &container.Config{Image: image},
	}
	createResponse, err := s.client.ContainerCreate(ctx, createOptions)
	if err != nil {
		return "", fmt.Errorf("Failed to create container %s: %w", name, err)
	}
	
	return createResponse.ID, nil
}

func (s *Service) StartContainer(ctx context.Context, containerID string) error {
	if _, err := s.client.ContainerStart(ctx, containerID, client.ContainerStartOptions{}); err != nil {
		return fmt.Errorf("failed to start container %s: %w", containerID, err)
	}

	return nil
}

