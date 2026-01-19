package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/BeauRussell/lambda-harness/internal/docker"
	embed "github.com/BeauRussell/lambda-harness/internal/embedded"
	tea "github.com/charmbracelet/bubbletea"
)

type CLIModel struct {
	NodeVersions []string
	cursor int
	selected map[int]docker.RunDetails
}


func initModel() CLIModel {
	return CLIModel{
		NodeVersions: []string{"nodejs:20", "nodejs:22", "nodejs:24"},
		selected: make(map[int]docker.RunDetails),
	}
}

func (m CLIModel) Init() tea.Cmd {
	return nil
}

func (m CLIModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit

		case "up":
			if m.cursor > 0 {
				m.cursor--
			}

		case "down":
			if m.cursor < len(m.NodeVersions)-1 {
				m.cursor++
			}

		case " ", "x":
			_, ok := m.selected[m.cursor]
			if ok {
				delete(m.selected, m.cursor)
			} else {
				version := m.NodeVersions[m.cursor]
				name := strings.ReplaceAll("lth-" + version, ":", "_")
				if strings.HasPrefix(version, "nodejs") {
					version = "public.ecr.aws/lambda/" + version
				} 
				m.selected[m.cursor] = docker.RunDetails{ Image: version, Name: name } 
			}

		case "enter":
			runTest()

			selectedRuns := make([]docker.RunDetails, 0, len(m.selected))
			for _, details := range m.selected {
				selectedRuns = append(selectedRuns, details)
			}

			docker.RunContainers(selectedRuns)

		}
	}

	return m, nil
}

func (m CLIModel) View() string {
	s := "What Node Versions would you like to test?\n\n"

	for i, choice := range m.NodeVersions {
		cursor := " "
		if m.cursor == i {
			cursor = ">"
		}

		checked := " "
		if _, ok := m.selected[i]; ok {
			checked = "x"
		}

		s += fmt.Sprintf("%s [%s] %s\n", cursor, checked, choice)
	}

	s += "\nPress q to quit.\n"

	return s
}

func runTest() error {
	result, err := embed.RunAnalyzer("/home/yourknightmares/repos/lth/lambdas/simple-cjs")
	if err != nil {
		log.Printf("Failed to run anaylzer: %v", err)
		return err
	}

	log.Println(result)

	return nil
}

func main() {
	p := tea.NewProgram(initModel())
	if _, err := p.Run(); err != nil {
		fmt.Printf("There's been an error: %v", err)
		os.Exit(1)
	}
}
