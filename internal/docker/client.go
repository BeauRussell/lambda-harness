package docker

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/moby/moby/client"
)

type RunDetails struct {
	Image string
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

	for _, run := range selectedRuns {
		go BuildContainer(ctx, apiClient, run)
	}

	return "", nil
}

func BuildContainer(ctx context.Context, apiClient *client.Client, run RunDetails) error {
	pullCtx, pullCancel := context.WithTimeout(ctx, 5*time.Minute)
	defer pullCancel()

	pullResponse, err := apiClient.ImagePull(pullCtx, run.Image, client.ImagePullOptions{})
	if err != nil {
		log.Printf("Failed to start image pull %s: %v\n", run.Image, err)
		return err
	}
	defer pullResponse.Close()

	err = pullResponse.Wait(pullCtx)
	if err != nil {
		log.Printf("Failed to pull image %s: %v\n", run.Image, err)
		return err
	}

	log.Println("DONE")
	return nil
}
