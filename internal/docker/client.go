package docker

import (
	"context"
	"log"

	"github.com/moby/moby/client"
)

type RunDetails struct {
	Image string
}

func RunContainers(selectedRuns []RunDetails) (string, error) {
	log.Println(selectedRuns)
	apiClient, err := client.New(client.FromEnv)
	if err != nil {
		log.Printf("Failed to create Docker Client: %v\n", err)
		return "", err
	}
	defer apiClient.Close()

	for _, run := range selectedRuns {
		go BuildContainer(apiClient, run)
	}

	return "", nil
}

func BuildContainer(apiClient *client.Client, run RunDetails) {
	pullResponse, err := apiClient.ImagePull(context.Background(), run.Image, client.ImagePullOptions{})
	if err != nil {
		log.Printf("Failed to pull %s: %v\n", run.Image, err)
	}

	err = pullResponse.Wait(context.Background())
	if err != nil {
		log.Printf("Failed to pull %s: %v\n", run.Image, err)
	}

	log.Println("DONE")
}
