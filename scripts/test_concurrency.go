package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
)

type UpdatePostPayload struct {
	Title   *string `json:"title"`
	Content *string `json:"content"`
}

func updatePost(postID int, p UpdatePostPayload, wg *sync.WaitGroup, currentIndex int) {
	defer wg.Done()

	// construct the URL for the update endpoint
	url := fmt.Sprintf("http://localhost:8080/v1/posts/%d", postID)

	// create the JSON payload
	b, _ := json.Marshal(p)

	req, err := http.NewRequest("PATCH", url, bytes.NewBuffer(b))
	if err != nil {
		fmt.Println("error creating request:", err)
		return
	}

	// set headers as needed, for example:
	req.Header.Set("Content-Type", "application/json")

	// send the request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("error sending request:", err)
		return
	}

	defer resp.Body.Close()

	fmt.Printf("update response status by %v is %v: \n", currentIndex, resp.Status)
}

func main() {
	var wg sync.WaitGroup
	postID := 9
	total := 100

	wg.Add(total)

	for i := 0; i < total; i++ {
		// Capture the current value of 'i' to avoid closure issue in goroutines.
		// Without this, all goroutines may reference the same (last) value of 'i'.
		currentIndex := i

		if i%2 == 0 {
			title := fmt.Sprintf("Dynamic Title %d", currentIndex)
			go updatePost(postID, UpdatePostPayload{Title: &title}, &wg, currentIndex)
		} else {
			content := fmt.Sprintf("Dynamic Content %d", i)
			go updatePost(postID, UpdatePostPayload{Content: &content}, &wg, currentIndex)
		}
	}

	wg.Wait()
}
