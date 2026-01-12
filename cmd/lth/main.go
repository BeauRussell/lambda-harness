package main

import (
	"fmt"
	"log"
	"os"

	embed "github.com/BeauRussell/lambda-harness/internal/embedded"
	"github.com/spf13/cobra"
)

func runTest(cmd *cobra.Command, args []string) error {
	path := "."
	if len(args) > 0 {
		path = args[0]
	}

	nodeVersions, _ := cmd.Flags().GetStringSlice("node")
	matrix, _ := cmd.Flags().GetBool("matrix")

	fmt.Fprintf(cmd.OutOrStdout(), "Testing Lambda at: %s\n", path)
	fmt.Fprintf(cmd.OutOrStdout(), "Node versions: %v\n", nodeVersions)
	fmt.Fprintf(cmd.OutOrStdout(), "Matrix mode: %v\n", matrix)

	result, err := embed.RunAnalyzer("/home/yourknightmares/repos/lth/lambdas/simple-cjs")
	if err != nil {
		log.Printf("Failed to run anaylzer: %v", err)
		return err
	}

	log.Println(result)

	return nil
}

func main() {
	rootCmd := &cobra.Command{
		Use:   "lth",
		Short: "Lambda Test Harness",
	}

	testCmd := &cobra.Command{
		Use:   "test [path]",
		Short: "Test a Lambda",
		Args:  cobra.MaximumNArgs(1),
		RunE:  runTest,
	}

	rootCmd.AddCommand(testCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
