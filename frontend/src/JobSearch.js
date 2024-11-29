import { getCurrencySymbol, extractFormData } from "./utils";
import { jobTemplate } from "./templates";

export class JobSearch {
    constructor(
        searchFormSelector, 
        resultsContainerSelector,
        loadingElementSelector,
    ) {
        this.searchForm = document.querySelector(searchFormSelector);
        this.resultsContainer = document.querySelector(resultsContainerSelector);
        this.loadingElement = document.querySelector(loadingElementSelector);
    }

    setCountryCode() {
        this.countryCode = "us";
        this.setCurrencySymbol();

        fetch("http://ip-api.com/json")
            .then(results => results.json())
            .then(results => {
                this.countryCode = results.countryCode.toLowerCase();
                this.setCurrencySymbol();
            })
            .catch(error => console.error('Error fetching country code:', error));
    }

    setCurrencySymbol() {
        this.currencySymbol = getCurrencySymbol(this.countryCode);
    }

    configureFormListener() {
        this.searchForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            this.resultsContainer.innerHTML = "";
            
            try {
                // Show loading state
                this.loadingElement.style.display = 'block';
                
                const { search, location } = extractFormData(this.searchForm);
                
                const response = await fetch(`http://localhost:3000/?search=${encodeURIComponent(search)}&location=${encodeURIComponent(location)}&country=${this.countryCode}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const { results } = await response.json();
                
                if (!results || results.length === 0) {
                    this.resultsContainer.innerHTML = '<p>No jobs found. Please try different search terms.</p>';
                    return;
                }

                const jobsHTML = results
                    .map(job => jobTemplate(job, this.currencySymbol))
                    .join("");
                
                this.resultsContainer.innerHTML = jobsHTML;
            } catch (error) {
                console.error('Error:', error);
                this.resultsContainer.innerHTML = '<p>An error occurred while fetching jobs. Please try again later.</p>';
            } finally {
                // Hide loading state
                this.loadingElement.style.display = 'none';
            }
        });
    }
}