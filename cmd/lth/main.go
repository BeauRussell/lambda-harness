package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "lth",
		Short: "Lambda Test Harness",
	}

	testCmd := &cobra.Command{
		Use:   "test [path]",
		Short: "Test a Lambda",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			path := "."
			if len(args) > 0 {
				path = args[0]
			}
			fmt.Printf("Testing Lambda at: %s\n", path)
			return nil
		},
	}

	testCmd.Flags().StringSliceP("node", "n", []string{"20"}, "Node version(s)")
	testCmd.Flags().BoolP("matrix", "m", false, "Run all versions")

	rootCmd.AddCommand(testCmd)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
