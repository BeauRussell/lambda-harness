package docker

import (
	"context"
	"log"

	"github.com/moby/moby/client"
)

func RunContainer() (string, error){
	apiClient, err := client.New(client.FromEnv)
	if err != nil {
		log.Printf("Failed to create Docker Client: %v\n", err)
		return "", err
	}
	defer apiClient.Close()

	config := client.ContainerCreateOptions{
		Name: "go-test",
		Image: "node:24-alpine",
	}

	result, err := apiClient.ContainerCreate(context.Background(), config)
	if err != nil {
		log.Printf("Failed to create docker container: %v\n", err)
		return "", err
	}

	log.Print(result)

	return "", nil
}
