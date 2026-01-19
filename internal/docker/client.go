package docker

import (
	"context"
	"log"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

type RunDetails struct {
	Image string
	Name string
}

func RunContainers(selectedRuns []RunDetails) (string, error) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	apiClient, err := client.New(client.FromEnv)
	if err != nil {
		log.Printf("Failed to create Docker Client: %v\n", err)
		return "", err
	}
	defer apiClient.Close()

	var wg sync.WaitGroup
	errCh := make(chan error, len(selectedRuns))
	for _, run := range selectedRuns {
		wg.Add(1)
		go func(rd RunDetails) {
			defer wg.Done()
			if err := buildContainer(ctx, apiClient, run); err != nil {
				errCh <- err
			}
		}(run)
	}

	wg.Wait()
	close(errCh)

	var lastErr error
	for err := range errCh {
		lastErr = err
		log.Printf("Container build failed: %v", err)
	}

	if lastErr != nil {
		return "", lastErr
	}

	return "All containers processed", nil
}

func buildContainer(ctx context.Context, apiClient *client.Client, run RunDetails) error {
	containerCtx, containerCancel := context.WithTimeout(ctx, 5*time.Minute)
	defer containerCancel()

	pullResponse, err := apiClient.ImagePull(containerCtx, run.Image, client.ImagePullOptions{})
	if err != nil {
		log.Printf("Failed to start image pull %s: %v\n", run.Image, err)
		return err
	}
	defer pullResponse.Close()

	err = pullResponse.Wait(containerCtx)
	if err != nil {
		log.Printf("Failed to pull image %s: %v\n", run.Image, err)
		return err
	}

	createConfig := &container.Config{
		Image: run.Image,
	}
	createOptions := client.ContainerCreateOptions {
		Config: createConfig,
		Name: run.Name,
	}
	createResponse, err := apiClient.ContainerCreate(containerCtx, createOptions)
	if err != nil {
		log.Printf("Failed to create Container %s: %v\n", createOptions.Name, err)
		return err
	}

	err = runContainer(containerCtx, apiClient, createResponse.ID)
	if err != nil {
		log.Printf("Failed to run container %s: %v", createResponse.ID, err)
		return err
	}

	return nil
}

func runContainer(containerCtx context.Context, apiClient *client.Client, containerId string) error {
	var options client.ContainerStartOptions
	_, err := apiClient.ContainerStart(containerCtx, containerId, options)
	if err != nil {
		log.Printf("Failed to start container %s: %v", containerId,err)
		return err
	}

	return nil
}
