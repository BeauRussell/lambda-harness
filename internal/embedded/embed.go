package embed

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
)

type AnalyzerResult struct {
	Handler     *HandlerConfig    `json:"handler"`
	Environment []EnvVarUsage     `json:"environment"`
	AWSServices []AWSServiceUsage `json:"awsServices"`
	Tests       []DiscoveredTest  `json:"tests"`
	Warnings    []string          `json:"warnings"`
}

type HandlerConfig struct {
	File       string `json:"file"`
	Export     string `json:"export"`
	Type       string `json:"type"`
	Confidence string `json:"confidence"`
	Source     string `json:"source"`
}

type EnvVarUsage struct {
	Name         string `json:"name"`
	HasDefault   bool   `json:"hasDefault"`
	DefaultValue string `json:"defaultValue,omitempty"`
}

type AWSServiceUsage struct {
	Service    string   `json:"service"`
	Operations []string `json:"operations"`
	SDKVersion string   `json:"sdkVersion"`
}

type DiscoveredTest struct {
	Name    string `json:"name"`
	Fixture string `json:"fixture"`
}

// TODO: Swap this to Docker-based execution
func RunAnalyzer(projectPath string) (*AnalyzerResult, error) {
	absPath, err := filepath.Abs(projectPath)
	if err != nil {
		return nil, fmt.Errorf("invalid path: %w", err)
	}

	cmd := exec.Command("bun", "run", "../../analyzer/src/index.ts", absPath)
	fmt.Printf("Exec Command: %+v\n", cmd)
	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("analyzer failed: %s", string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("failed to run analyzer: %w", err)
	}

	fmt.Println("Lambda output: ", string(output))

	var result AnalyzerResult
	if err := json.Unmarshal(output, &result); err != nil {
		return nil, fmt.Errorf("failed to parse analyzer output: %w", err)
	}

	return &result, nil
}
