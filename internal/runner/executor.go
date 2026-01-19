package runner

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/BeauRussell/lambda-harness/internal/docker"
)

type RunDetails struct {
	Image string
	CodePath string
	TestCmd []string
}

type RunResult struct {
	Details RunDetails
	ContainerID string
	TestOutput string
	Error error
}

type Runner struct {
	docker *docker.Service
}

func NewRunner(ds *docker.Service) *Runner {
	return &Runner{docker: ds}
}
