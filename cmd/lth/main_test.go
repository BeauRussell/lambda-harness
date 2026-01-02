// main_test.go
package main

import (
	"bytes"
	"strings"
	"testing"

	"github.com/spf13/cobra"
)

// Helper to create a fresh test command
func createTestCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "test [path]",
		Short: "Test a Lambda",
		Args:  cobra.MaximumNArgs(1),
		RunE:  runTest,
	}
	cmd.Flags().StringSliceP("node", "n", []string{"20"}, "Node version(s)")
	cmd.Flags().BoolP("matrix", "m", false, "Run all versions")
	return cmd
}

func TestRunTest_DefaultPath(t *testing.T) {
	var buf bytes.Buffer
	cmd := createTestCmd()
	cmd.SetOut(&buf)
	cmd.SetArgs([]string{})

	err := cmd.Execute()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Testing Lambda at: .") {
		t.Errorf("expected default path, got: %s", output)
	}
}

func TestRunTest_CustomPath(t *testing.T) {
	var buf bytes.Buffer
	cmd := createTestCmd()
	cmd.SetOut(&buf)
	cmd.SetArgs([]string{"./my-lambda"})

	err := cmd.Execute()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Testing Lambda at: ./my-lambda") {
		t.Errorf("expected custom path, got: %s", output)
	}
}

func TestRunTest_NodeFlag(t *testing.T) {
	var buf bytes.Buffer
	cmd := createTestCmd()
	cmd.SetOut(&buf)
	cmd.SetArgs([]string{"--node", "18,20", "./test"})

	err := cmd.Execute()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Node versions: [18 20]") {
		t.Errorf("expected Node versions [18 20], got: %s", output)
	}
}

func TestRunTest_ShortFlags(t *testing.T) {
	var buf bytes.Buffer
	cmd := createTestCmd()
	cmd.SetOut(&buf)
	cmd.SetArgs([]string{"-n", "16", "-m", "./test"})

	err := cmd.Execute()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Node versions: [16]") {
		t.Errorf("expected Node versions [16], got: %s", output)
	}
	if !strings.Contains(output, "Matrix mode: true") {
		t.Errorf("expected Matrix mode true, got: %s", output)
	}
}
