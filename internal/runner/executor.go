package runner

import (
	"context"
	"fmt"
	"strings"
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

func (r *Runner) RunAll(ctx context.Context, runs  []RunDetails) []RunResult {
	var wg sync.WaitGroup
	results := make([]RunResult, len(runs))

	for i, run := range runs {
		wg.Add(1)
		go func (idx int, rd RunDetails) {
			defer wg.Done()
			results[idx] = r.runSingle(ctx, rd)
		}(i, run)
	}

	wg.Wait()
	return results
}

func (r *Runner) runSingle(ctx context.Context, run RunDetails) RunResult {
	result := RunResult{Details: run}
	workflowCtx, cancel := context.WithTimeout(ctx, 10*time.Minute)
	defer cancel()

	name := fmt.Sprintf("lth-test-%s", strings.ReplaceAll(run.Image, "/", "_"))

	if err := r.docker.PullImage(workflowCtx, run.Image); err != nil {
		result.Error = fmt.Errorf("pull failed: %w", err)
		return result
	}

	containerID, err := r.docker.CreateContainer(workflowCtx, name, run.Image)
	if err != nil {
		result.Error = fmt.Errorf("create failed: %w", err)
		return result
	}
	result.ContainerID = containerID

	if err := r.docker.StartContainer(workflowCtx, containerID); err != nil {
		result.Error = fmt.Errorf("start failed: %w", err)
		return result
	}
	
	return result
}

func (r *Runner) Cleanup(ctx context.Context, results []RunResult) {
	for _, res := range results {
		if res.ContainerID != "" {
			// TODO: Cleanup after Run
		}
	}
}
