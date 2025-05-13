document.addEventListener('DOMContentLoaded', function() {
    try {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
            showNoAccessMessage();
            return;
        }

        showAdminContent();
        fetchAdminInfo();
        setupNavigation();
        setupUserMenu();
        setupDeleteModal();
        loadAllSections();
        console.log('Admin page initialized successfully');
    } catch (error) {
        console.error('Error initializing admin page:', error);
        document.body.innerHTML += `<p style="color: red;">Error initializing admin page: ${error.message}</p>`;
    }
});

function showNoAccessMessage() {
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('noAccessMessage').style.display = 'block';
}

function showAdminContent() {
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('noAccessMessage').style.display = 'none';
}

function fetchAdminInfo() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        console.error('No admin token found');
        return;
    }

    fetch('/api/admin/info', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Admin info fetched successfully:', data);
        const userIcon = document.getElementById('userIcon');
        if (userIcon) {
            userIcon.textContent = data.username[0].toUpperCase();
        } else {
            console.error('User icon element not found');
        }
    })
    .catch(error => {
        console.error('Error fetching admin info:', error);
        document.body.innerHTML += `<p style="color: red;">Error loading admin info: ${error.message}</p>`;
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    const sections = document.querySelectorAll('main section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');
            
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            document.getElementById(targetId).style.display = 'block';
            
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            
            link.classList.add('active');
            loadSectionData(targetId);
        });
    });
}

function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'usersSection':
            fetchUserData();
            break;
        case 'analyticsSection':
            fetchAnalyticsData();
            break;
        case 'messagesSection':
            fetchMessages();
            break;
    }
}

function setupUserMenu() {
    const userIcon = document.getElementById('userIcon');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const homeBtn = document.getElementById('homeBtn');
    const chatBtn = document.getElementById('chatBtn');

    userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
    });

    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/';
    });

    chatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/chat';
    });
    document.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin-login';
}

function setupUserActions() {
    const deleteBtns = document.querySelectorAll('.delete-icon');

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const userId = this.getAttribute('data-id');
            showDeleteModal(userId);
        });
    });
}

function showDeleteModal(userId) {
    currentUserId = userId;
    if (deleteModal) {
        deleteModal.style.display = 'block';
    }
}

function hideDeleteModal() {
    if (deleteModal) {
        deleteModal.style.display = 'none';
    }
    currentUserId = null;
}

function deleteUser(userId) {
    fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchUserData();
        } else {
            console.error('Failed to delete user');
        }
    })
    .catch(error => console.error('Error deleting user:', error))
    .finally(() => {
        hideDeleteModal();
    });
}

function setupDeleteModal() {
    deleteModal = document.getElementById('deleteModal');
    confirmDeleteBtn = document.getElementById('confirmDelete');
    cancelDeleteBtn = document.getElementById('cancelDelete');

    if (!deleteModal || !confirmDeleteBtn || !cancelDeleteBtn) {
        console.error('Delete modal elements not found');
        return;
    }

    confirmDeleteBtn.addEventListener('click', function() {
        if (currentUserId) {
            deleteUser(currentUserId);
        }
    });

    cancelDeleteBtn.addEventListener('click', function() {
        hideDeleteModal();
    });

    window.addEventListener('click', function(event) {
        if (event.target === deleteModal) {
            hideDeleteModal();
        }
    });
}

function fetchAnalyticsData() {
    const analyticsSection = document.getElementById('analyticsSection');
    analyticsSection.innerHTML = '<h2>Analytics</h2><p>Loading analytics data...</p>';

    Promise.all([
        fetch('/api/admin/analytics/new-users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        }),
        fetch('/api/admin/analytics/user-actions', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        }),
        fetch('/api/admin/analytics/messages', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        }).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
    ])
    .then(([newUsersData, userActionsData, messagesData]) => {
        console.log('Analytics data fetched successfully');
        analyticsSection.innerHTML = `
            <h2>Analytics</h2>
            <div class="chart-container">
                <canvas id="newUsersChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="userActionsChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="messagesChart"></canvas>
            </div>
        `;
        createNewUsersChart(newUsersData);
        createUserActionsChart(userActionsData);
        createMessagesChart(messagesData);
    })
    .catch(error => {
        console.error('Error fetching analytics data:', error);
        analyticsSection.innerHTML = `<h2>Analytics</h2><p style="color: red;">Error loading analytics data: ${error.message}</p>`;
    });
}

function createNewUsersChart(data) {
    const ctx = document.getElementById('newUsersChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'New Users',
                data: data.values,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'New Users Over Time'
                }
            }
        }
    });
}

function createUserActionsChart(data) {
    const ctx = document.getElementById('userActionsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'User Actions',
                data: data.values,
                backgroundColor: 'rgba(153, 102, 255, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'User Actions by Type'
                }
            }
        }
    });
}

function createMessagesChart(data) {
    const ctx = document.getElementById('messagesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Messages',
                data: data.values,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Messages Over Time'
                }
            }
        }
    });
}

function fetchMessages() {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '<p>Loading messages...</p>';

    fetch('/api/admin/messages', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(messages => {
        console.log('Messages fetched successfully:', messages);
        messageList.innerHTML = '';
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.innerHTML = `
                <strong>${msg.firstName} ${msg.lastName}</strong> - ${new Date(msg.createdAt).toLocaleString()}<br>
                <em>${msg.email}</em><br>
                ${msg.message}
            `;
            messageList.appendChild(messageElement);
        });
    })
    .catch(error => {
        console.error('Error fetching messages:', error);
        messageList.innerHTML = `<p style="color: red;">Error loading messages: ${error.message}</p>`;
    });
}

function loadAllSections() {
    const activeSection = document.querySelector('.sidebar .nav-link.active');
    if (activeSection) {
        const sectionId = activeSection.getAttribute('data-section');
        document.getElementById(sectionId).style.display = 'block';
        loadSectionData(sectionId);
    } else {
        const firstSection = document.querySelector('.sidebar .nav-link');
        if (firstSection) {
            firstSection.click();
        }
    }
}

function fetchUserData() {
    fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('User data fetched successfully:', data);
        const userTableBody = document.querySelector('#userTable tbody');
        if (userTableBody) {
            userTableBody.innerHTML = '';
            data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>${new Date(user.registeredDate).toLocaleDateString()}</td>
                    <td>${user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : 'N/A'}</td>
                    <td>
                        <button class="action-icon delete-icon" data-id="${user._id}" title="Delete user">
                            <img src="/images/delete-icon.png" alt="Delete" class="icon">
                        </button>
                    </td>
                `;
                userTableBody.appendChild(row);
            });
            setupUserActions();
        } else {
            console.error('User table body not found');
        }
    })
    .catch(error => {
        console.error('Error fetching user data:', error);
        const userSection = document.getElementById('usersSection');
        userSection.innerHTML += `<p style="color: red;">Error loading user data: ${error.message}</p>`;
    });
}

let currentUserId = null;
let deleteModal = null;
let confirmDeleteBtn = null;
let cancelDeleteBtn = null;
