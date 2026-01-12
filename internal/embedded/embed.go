package embed

import (
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
)

type AnalyzerResult struct {
	Analysis AnalysisResult `json:"analysis"`
	Dependencies []Dependency `json:"dependencies"`
}

type Dependency struct {
	Name string `json:"name"`
	Version string `json:"version"`
}

type HttpCall struct {
	Url ResolvedUrl `json:"url"`
	Method string `json:"method"`
	Location string `json:"location"`
}

type AnalysisResult struct {
  EnvVars []string 
  httpCalls []HttpCall;
}

type UrlComponent struct {
	TypeComponent string
	Value string `json:"value,omitempty"` 
	EnvVar string `json:"envVar,omitempty"`
	VarName string `json:"varName,omitempty"`
}

type ResolvedUrl struct {
	components []UrlComponent
	raw string
	envVars []string
	isFullyStatic bool
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
