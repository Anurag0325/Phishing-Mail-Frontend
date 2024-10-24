<template>
    <div>
        <nav class="navbar">
            <div class="navbar-brand">
                <img src="KVQA.jpeg" alt="Logo" class="logo" />
                <h1>KVQA Admin</h1>
                <div class="navbar-buttons">
                    <button @click="openQuestionModal">Manage Questions</button>
                </div>
            </div>
        </nav>

        <div>
            <div v-if="showQuestionModal" class="modal">
                <div class="modal-content">
                    <div>
                        <h3>{{ isEditing ? 'Edit Question' : 'Add Question' }}</h3>
                        <form @submit.prevent="isEditing ? updateQuestion() : addQuestion()">
                            <input v-model="question.question_text" placeholder="Question Text" required />
                            <div class="options-container">
                                <div v-for="(option, index) in question.options" :key="index" class="option-item">
                                    <input
                                        v-model="question.options[index]"
                                        placeholder="Option"
                                        required
                                    />
                                    <button type="button" @click="deleteOption(index)">Delete Option</button>
                                </div>
                                <button type="button" @click="addOption">Add Option</button>
                            </div>
                            <div class="form-group">
                                <select v-model="question.answer" required>
                                    <option value="" disabled>Select Correct Answer</option>
                                    <option v-for="option in question.options" :key="option">{{ option }}</option>
                                </select>
                                <div class="form-buttons">
                                    <button type="submit">{{ isEditing ? 'Update' : 'Add' }}</button>
                                    <button type="button" @click="cancel">Cancel</button>
                                </div>
                            </div>
                        </form>
                    </div>  
                              
                    <div class="questions-list">
                        <h3>Questions List</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Question Text</th>
                                    <th>Options</th>
                                    <th>Answer</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="question in questions" :key="question.id">
                                    <td>{{ question.id }}</td>
                                    <td>{{ question.question_text }}</td>
                                    <td>{{ question.options.join(', ') }}</td>
                                    <td>{{ question.answer }}</td>
                                    <td>
                                        <button @click="editQuestion(question)">Edit</button>
                                        <button @click="deleteQuestion(question.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <button class="close-button" @click="closeQuestionModal">Close</button>
                </div>
            </div>

            <h2>Admin Dashboard</h2>
            <div class="admin-panel">
                <label for="department">Select Department:</label>
                <select v-model="selectedDepartment" id="department">
                    <option value="" disabled>Select a department</option>
                    <option value="HR">HR</option>
                    <option value="Accounts">Accounts</option>
                </select>

                <div class="upload-section">
                    <label for="fileUpload">Upload Colleagues Data (.xlsx):</label>
                    <input type="file" id="fileUpload" @change="handleFileUpload" />
                    <button @click="uploadColleaguesData">Upload</button>
                </div>
            </div>
        
            <button @click="sendPhishingEmails">Send Phishing Email</button>
            <button @click="downloadReport">Download Performance Report</button>
            <button @click="emailedCandidatesReport">Generate Emailed Candidates Report</button>
        
            <h2>Candidate Reports</h2>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Colleague Name</th>
                        <th>Clicked</th>
                        <th>Answered</th>
                        <th>Correct Answers</th>
                        <th>Score (out of 100)</th>
                        <th>Download Report</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="report in reports" :key="report.id">
                        <td>{{ report.id }}</td>
                        <td>{{ getColleagueName(report.colleague_id) }}</td>
                        <td>{{ report.clicked ? 'Yes' : 'No' }}</td>
                        <td>{{ report.answered ? 'Yes' : 'No' }}</td>
                        <td>{{ calculateCorrectAnswers(report.answers) }}/{{ questions.length }}</td>
                        <td>{{ calculateScoreOutOf100(report.answers) }}%</td>
                        <td>
                            <button @click="downloadPDF(report.colleague_id)">Download PDF</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>


<script>

export default {
    data() {
        return {
            reports: [],
            questions: [],
            colleagues: [],
            pollingInterval: null,
            isGenerating: false,
            file: null,
            showQuestionModal: false,
            selectedDepartment: '',
            isEditing: false,
            question: {
                id: null,
                question_text: '',
                options: ['', ''],
                answer: ''
            },
        };
    },

    methods: {

        async sendPhishingEmails() {
            if (!this.selectedDepartment) {
                alert("Please select a department before sending emails.");
                return;
            }

            try {
                const response = await fetch('https://phishing-mail-application.onrender.com/send_email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ department: this.selectedDepartment })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                this.message = data.message;
            } catch (error) {
                console.error('Failed to send emails:', error);
                this.message = 'Error sending emails. Please try again.';
            }
        },

        async fetchReports() {
            try {
                const response = await fetch('https://phishing-mail-application.onrender.com/reports');
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                this.reports = data;
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            }
        },

        async fetchQuestions() {
            try {
                const response = await fetch('https://phishing-mail-application.onrender.com/questions');
                const data = await response.json();
                this.questions = data;
            } catch (error) {
                console.error('Failed to fetch questions:', error);
            }
        },

        async fetchColleagues() {
            try {
                const response = await fetch('https://phishing-mail-application.onrender.com/users');
                const data = await response.json();
                this.colleagues = data;
            } catch (error) {
                console.error('Failed to fetch colleagues:', error);
            }
        },

        getColleagueName(colleagueId) {
            const colleague = this.colleagues.find(c => c.id === colleagueId);
            return colleague ? colleague.name : 'Unknown';
        },

        calculateCorrectAnswers(answers) {
            if (!Array.isArray(answers) || answers.length === 0) {
                return 0;
            }

            let correctAnswers = 0;
            answers.forEach((answer, index) => {
                if (this.isCorrect(index, answer)) {
                    correctAnswers++;
                }
            });
            return correctAnswers;
        },

        calculateScoreOutOf100(answers) {
            const correctAnswers = this.calculateCorrectAnswers(answers);
            const totalQuestions = this.questions.length;
            const scoreOutOf100 = (correctAnswers / totalQuestions) * 100;
            return scoreOutOf100.toFixed(2);
        },

        isCorrect(questionIndex, answer) {
            const question = this.questions[questionIndex];
            return question && question.answer === answer;
        },

        async downloadReport() {
            const response = await fetch('https://phishing-mail-application.onrender.com/generate_reports');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'candidate_reports.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        },

        async downloadPDF(colleagueId) {
            try {
                const response = await fetch(`https://phishing-mail-application.onrender.com/download_report/${colleagueId}`);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `report_${colleagueId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Failed to download PDF report:', error);
            }
        },

        async emailedCandidatesReport() {
            if (this.isGenerating) return;
            this.isGenerating = true;
            this.stopPolling();

            try {
                const response = await fetch(`https://phishing-mail-application.onrender.com/generate_emailed_candidates_report`, {
                    method: 'GET'
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", "emailed_candidates_report.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    const errorData = await response.json();
                    alert(`Error: ${errorData.error || response.statusText}`);
                }
            } catch (error) {
                console.error("Error generating report:", error);
                alert("An error occurred while generating the report.");
            } finally {
                this.isGenerating = false;
                this.startPolling();
            }
        },

        handleFileUpload(event) {
            this.file = event.target.files[0];
        },

        async uploadColleaguesData() {
            if (!this.file) {
                alert("Please select a file.");
                return;
            }

            const formData = new FormData();
            formData.append('file', this.file);

            try {
                const response = await fetch('https://phishing-mail-application.onrender.com/upload_colleagues_data', {
                method: 'POST',
                body: formData,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();
                alert("Colleagues data updated successfully!");
            } catch (error) {
                console.error("Error uploading data:", error);
                alert("Failed to upload data. Please try again.");
            }
        },

        startPolling() {
            this.fetchReports();
            this.pollingInterval = setInterval(async () => {
                if (!this.isGenerating) {
                    await this.fetchReports();
                }
            }, 5000);
        },

        stopPolling() {
            clearInterval(this.pollingInterval);
        },

        openQuestionModal() {
            this.showQuestionModal = true;
            this.fetchQuestions();
        },

        closeQuestionModal() {
            this.showQuestionModal = false;
            this.resetQuestionForm();
        },

        resetQuestionForm() {
            this.isEditing = false;
            this.question = {
                id: null,
                question_text: '',
                options: ['', ''],
                answer: ''
            };
        },

        async fetchQuestions() {
            try {
                const response = await fetch('https://phishing-mail-application.onrender.com/questions');
                const data = await response.json();
                this.questions = data;
            } catch (error) {
                console.error('Failed to fetch questions:', error);
            }
        },

        async addQuestion() {
            const response = await fetch('https://phishing-mail-application.onrender.com/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.question)
            });
            await response.json();
            this.fetchQuestions();
            this.resetForm();
        },

        async editQuestion(question) {
            this.currentQuestionId = question.id;
            this.question = { ...question };

            if (!Array.isArray(this.question.options)) {
                this.question.options = [];
            }

            this.isEditing = true;
            this.showQuestionForm = true;
        },

        async updateQuestion() {
            if (!this.currentQuestionId) {
                alert('No question selected for updating.');
                return;
            }

            const response = await fetch(`https://phishing-mail-application.onrender.com/questions/${this.currentQuestionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.question)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error updating question:', errorData);
                alert(`Error: ${errorData.error || 'Something went wrong!'}`);
                return;
            }

            const data = await response.json();
            console.log('Success:', data.message);
            this.fetchQuestions();
            this.resetForm();
        },


        async editQuestion(question) {
            this.currentQuestionId = question.id;
            console.log('Editing Question ID:', this.currentQuestionId);
            this.question = { ...question };

            if (!Array.isArray(this.question.options)) {
                this.question.options = [];
            }

            this.isEditing = true;
            this.showQuestionForm = true;
        },

        async deleteQuestion(id) {
            await fetch(`https://phishing-mail-application.onrender.com/questions/${id}`, {
                method: 'DELETE'
            });
            this.fetchQuestions();
        },

        resetForm() {
            this.question = {
                question_text: '',
                options: ['', ''],
                answer: ''
            };
            this.isEditing = false;
            this.currentQuestionId = null;
        },

        addOption() {
            if (Array.isArray(this.question.options)) {
                if (this.question.options.length < 4) {
                    this.question.options.push('');
                } else {
                    alert('You can only add up to 4 options.');
                }
            } else {
                console.error("Options is not defined or is not an array");
            }
        },

        deleteOption(index) {
            if (this.question.options.length > 2) {
                this.question.options.splice(index, 1);
            } else {
                alert('You must have at least 2 options.');
            }
        },

        cancel() {
            this.resetQuestionForm();
        }, 
    },

    async mounted() {
        await this.fetchReports();
        await this.fetchQuestions();
        await this.fetchColleagues();
        this.startPolling();
    },

    beforeDestroy() {
        this.stopPolling();
    },
};
</script>


<style scoped>
    * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background-color: #f7f7f7;
    color: #333;
    padding-top: 80px;
}


.logo {
    height: 40px;
    margin-right: 10px;
    margin-right: 1rem;
}

.nav-links {
    list-style: none;
    display: flex;
}

.nav-links li {
    margin-left: 20px;
}

.nav-links a {
    color: white;
    text-decoration: none;
    font-size: 18px;
    transition: color 0.3s ease;
}

.nav-links a:hover {
    color: #c2e8a7;
}

.main-content {
    margin-top: 20px;
    padding: 40px;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
}

h2 {
    font-size: 28px;
    color: #444;
    border-bottom: 2px solid #69b820;
    padding-bottom: 15px;
    margin-bottom: 30px;
}

button {
    padding: 8px 12px;
    font-size: 14px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin: 5px 5px;
}


button:hover {
    background-color: #57a015;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}


table {
    width: 100%;
    border-collapse: collapse;
}


table, th, td {
    border: 1px solid #ddd;
    border-spacing: 0;
}


td {
    padding: 4px 8px; 
    border: 1px solid #ddd; 
    font-size: 14px; 
    text-align: left; 
}

th {
    padding: 4px 8px; 
    background-color: #f2f2f2; 
    text-align: left;
    font-weight: bold;
    border: 1px solid #ddd; 
    font-size: 14px; 
}

tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}



tbody tr:hover {
    background-color: #f1f1f1;
}


tbody tr {
    transition: background-color 0.3s ease;
    height: auto; 
}

td button {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 5px;
}

@media (max-width: 768px) {
    .main-content {
        width: 95%;
        padding: 20px;
    }

    table, th, td {
        font-size: 14px;
        padding: 10px;
    }

    button {
        padding: 10px 20px;
        font-size: 16px;
    }
}

.admin-panel {
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    margin: 1rem 0;
}

h1 {
    font-size: 24px;
    margin-bottom: 20px;
}

label {
    margin-right: 10px;
}

select {
    padding: 5px;
    margin-bottom: 20px;
}

.message {
    margin-top: 20px;
    color: green;
}

.upload-section {
    margin: 1rem 0;
}


.navbar {
    background-color: #950707;
    color: white;
    padding: 1rem;
    position: relative;
    z-index: 100;
}

.navbar-brand {
    display: flex;
    align-items: center;
}

.logo {
    height: 40px;
    margin-right: 1rem;
}


.modal-content {
    background: white;
    padding: 8px 16px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 800px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.questions-list {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 20px;
}


.navbar-buttons {
    margin-left: auto;
}

.close-button {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 4px;
}

.modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    z-index: 1200;
    width: 800px;
}

.modal-content h3 {
    font-size: 22px;
    margin-bottom: 15px;
}

.modal-content form {
    display: flex;
    flex-direction: column;
}

.modal-content input[type="text"],
.modal-content select {
    padding: 10px;
    font-size: 14px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    width: 100%;
}

.modal-content input::placeholder {
    color: #999;
}

.modal-content button {
    padding: 10px 20px;
    font-size: 14px;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    margin-top: 10px;
}

.modal-content button:hover {
    background-color: #0056b3;
}

.modal-content .close-button {
    background-color: #f44336;
}

.modal-content .close-button:hover {
    background-color: #d32f2f;
}

.modal-content button[type="button"] {
    font-size: 12px;
    padding: 8px;
    background-color: #28a745;
    margin-top: 5px;
}

.modal-content button[type="button"]:hover {
    background-color: #218838;
}

.modal-content input[type="text"] {
    font-size: 14px;
    padding: 8px;
}

.modal-content input::placeholder {
    font-size: 12px;
    color: #888;
}

.questions-list table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
}

.questions-list th, .questions-list td {
    padding: 10px;
    border: 1px solid #ddd;
}

.questions-list th {
    background-color: #f4f4f4;
    font-size: 14px;
}

.questions-list td {
    font-size: 13px;
}

.questions-list button {
    padding: 8px 12px;
    font-size: 12px;
    background-color: #0f78c8;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.questions-list h3 {
    margin-top: 1px;
    margin-bottom: 5px;
}

.questions-list button:hover {
    background-color: #57a015;
}

.options-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
}

.option-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

.option-item input {
    margin-right: 0.5rem;
}

.form-group {
    display: flex;
    align-items: center;
}

.form-group select {
    margin-right: 10px;
}

.form-buttons {
    display: flex;
    gap: 10px;
}

.form-buttons button {
    padding: 10px 15px; 
    font-size: 16px; 
    margin-left: 5px; 
    cursor: pointer; 
    border: none; 
    border-radius: 5px;
}

.form-buttons button:hover {
    background-color: #045b31;
    color: white;
}

.form-buttons button[type="submit"]:hover {
    background-color: #218838;
}

.form-buttons button[type="submit"] {
    background-color: #007BFF;
    color: white;
}

.form-buttons button[type="button"] {
    background-color: #dc3545;
    color: white;
}
</style>