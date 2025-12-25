document.addEventListener("DOMContentLoaded", () => {
  let currentUserEmail = localStorage.getItem('currentUserEmail');

  function getStorageKey(key) {
      return currentUserEmail ? `${currentUserEmail}_${key}` : key;
  }

  // ================= DATE LOGIC =================
  function updateText() {
    const day = document.querySelector(".day");
    const date = document.querySelector(".date");

    if (day && date) {
      const today = new Date().toLocaleDateString("en-IN", { weekday: "long" });
      const fullDate = new Date().toLocaleDateString("en-IN");

      day.innerText = today;
      date.innerText = fullDate;
    }
  }

  updateText();

  function scheduleMidnightUpdate() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight - now;

    setTimeout(() => {
      updateText();
      scheduleMidnightUpdate();
    }, timeUntilMidnight);
  }

  scheduleMidnightUpdate();

  // ================= LOCAL STORAGE MANAGEMENT =================
  let tasks = [];
  let currentView = 'dashboard'; // 'dashboard' or 'vital'

  // Load tasks from localStorage on page load
  function loadTasks() {
    try {
      const savedTasks = localStorage.getItem(getStorageKey('todoTasks'));
      if (savedTasks) {
        tasks = JSON.parse(savedTasks);
      }
    } catch (e) {
      console.error("Error parsing tasks from localStorage:", e);
      tasks = [];
    }
    renderAllTasks();
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem(getStorageKey('todoTasks'), JSON.stringify(tasks));
  }

  // Render all tasks
  function renderAllTasks() {
    const todayTask = document.querySelector(".todaytask");
    const completedScroll = document.querySelector(".comscroll");
    
    // Force clear
    while (todayTask.firstChild) {
      todayTask.removeChild(todayTask.firstChild);
    }
    while (completedScroll.firstChild) {
      completedScroll.removeChild(completedScroll.firstChild);
    }
    
    let pendingIndex = 0;
    let completedIndex = 0;
    
    if (currentView === 'categories') {
        // Create category containers
        const categories = ['School', 'Work', 'House', 'Miscellaneous'];
        const containers = {};

        categories.forEach(cat => {
            const section = document.createElement('div');
            section.className = 'category-section';
            section.innerHTML = `<h4 class="category-title"><i class="fa-solid fa-tag"></i> ${cat}</h4><div class="category-tasks" style="display: flex; flex-direction: column; gap: 1rem;"></div>`;
            todayTask.appendChild(section);
            containers[cat] = section.querySelector('.category-tasks');
        });

        tasks.forEach((task, index) => {
            const taskElement = createTaskElement(task.name, task.description, task.priority, task.status || 'Pending', task.date, task.category, index);
            
            if (task.status === 'Completed') {
                completedScroll.appendChild(taskElement);
                completedIndex++;
            } else {
                const cat = task.category || 'Miscellaneous';
                if (containers[cat]) containers[cat].appendChild(taskElement);
                else containers['Miscellaneous'].appendChild(taskElement);
                pendingIndex++;
            }
        });
    } else {
        // Standard Dashboard or Vital view
        tasks.forEach((task, index) => {
            if (currentView === 'vital' && task.priority !== 'High') return;
            
            if (currentView === 'today') {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                if (task.date !== todayStr) return;
            }

            const taskElement = createTaskElement(task.name, task.description, task.priority, task.status || 'Pending', task.date, task.category, index);
            
            if (task.status === 'Completed') {
                completedScroll.appendChild(taskElement);
                completedIndex++;
            } else {
                todayTask.appendChild(taskElement);
                pendingIndex++;
            }
        });
    }

    // Update task statistics
    updateTaskStatistics();
  }

  // Update task statistics (circles and progress)
  function updateTaskStatistics() {
    const comCircle = document.querySelector('.comcircle');
    const progCircle = document.querySelector('.progcircle');
    const pendCircle = document.querySelector('.pendcircle');
    
    // Filter tasks based on current view for statistics
    let relevantTasks = tasks;
    if (currentView === 'vital') {
        relevantTasks = tasks.filter(t => t.priority === 'High');
    } else if (currentView === 'today') {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        relevantTasks = tasks.filter(t => t.date === todayStr);
    }

    if (relevantTasks.length === 0) {
      comCircle.innerHTML = '<span class="progress-text">0%</span>';
      comCircle.style.background = `conic-gradient(#10b981 0%, var(--track-color) 0%)`;
      
      progCircle.innerHTML = '<span class="progress-text">0%</span>';
      progCircle.style.background = `conic-gradient(#ef4444 0%, var(--track-color) 0%)`;
      
      pendCircle.innerHTML = '<span class="progress-text">0%</span>';
      pendCircle.style.background = `conic-gradient(#3b82f6 0%, var(--track-color) 0%)`;
      
      document.querySelector('.line').style.background = '#e0e0e0';
      return;
    }

    const completed = relevantTasks.filter(t => t.status === 'Completed').length;
    const inProgress = relevantTasks.filter(t => t.status === 'In Progress').length;
    const pending = relevantTasks.filter(t => t.status === 'Pending').length;
    const total = relevantTasks.length;

    const completedPercent = Math.round((completed / total) * 100);
    const inProgressPercent = Math.round((inProgress / total) * 100);
    const pendingPercent = Math.round((pending / total) * 100);

    // Update circle percentages
    comCircle.innerHTML = `<span class="progress-text">${completedPercent}%</span>`;
    comCircle.style.background = `conic-gradient(#10b981 ${completedPercent}%, var(--track-color) 0)`;

    progCircle.innerHTML = `<span class="progress-text">${inProgressPercent}%</span>`;
    progCircle.style.background = `conic-gradient(#ef4444 ${inProgressPercent}%, var(--track-color) 0)`;

    pendCircle.innerHTML = `<span class="progress-text">${pendingPercent}%</span>`;
    pendCircle.style.background = `conic-gradient(#3b82f6 ${pendingPercent}%, var(--track-color) 0)`;

    // Update overall progress bar
    const line = document.querySelector('.line');
    line.style.background = `linear-gradient(to right, 
      #10b981 0%, #10b981 ${completedPercent}%, 
      #ef4444 ${completedPercent}%, #ef4444 ${completedPercent + inProgressPercent}%, 
      #3b82f6 ${completedPercent + inProgressPercent}%, #3b82f6 100%)`;
  }

  // ================= VIEW NAVIGATION LOGIC =================
  const navDashboard = document.getElementById('navDashboard');
  const navVital = document.getElementById('navVital');
  const navToday = document.getElementById('navToday');
  const navCategories = document.getElementById('navCategories');
  const navSettings = document.getElementById('navSettings');
  const todoTitle = document.querySelector('.todotext h3');
  const dashb = document.querySelector('.dashb');
  const settingsView = document.querySelector('.settings-view');

  // Initialize history
  history.replaceState({ view: 'dashboard' }, '', '#dashboard');

  window.addEventListener('popstate', (event) => {
      if (event.state && event.state.view) {
          currentView = event.state.view;
          updateView(false);
      }
  });

  function updateView(addToHistory = true) {
    if (addToHistory) {
        history.pushState({ view: currentView }, '', `#${currentView}`);
    }

    // Update Sidebar Active State
    if (navDashboard) navDashboard.classList.remove('active');
    if (navVital) navVital.classList.remove('active');
    if (navToday) navToday.classList.remove('active');
    if (navCategories) navCategories.classList.remove('active');
    if (navSettings) navSettings.classList.remove('active');

    // Default visibility
    if (dashb) dashb.style.display = 'grid';
    if (settingsView) settingsView.style.display = 'none';

    if (currentView === 'dashboard') {
        if (navDashboard) navDashboard.classList.add('active');
        todoTitle.innerText = 'To-Do';
        renderAllTasks();
    } else if (currentView === 'vital') {
        if (navVital) navVital.classList.add('active');
        todoTitle.innerText = 'Vital Task';
        renderAllTasks();
    } else if (currentView === 'today') {
        if (navToday) navToday.classList.add('active');
        todoTitle.innerText = 'Due Today';
        renderAllTasks();
    } else if (currentView === 'categories') {
        if (navCategories) navCategories.classList.add('active');
        todoTitle.innerText = 'Categories';
        renderAllTasks();
    } else if (currentView === 'settings') {
        if (navSettings) navSettings.classList.add('active');
        if (dashb) dashb.style.display = 'none';
        if (settingsView) settingsView.style.display = 'block';
        
        // Populate settings
        const current = loadSettings();
        if (document.getElementById('settingsNameMain')) document.getElementById('settingsNameMain').value = current.name;
        if (document.getElementById('settingsEmailMain')) document.getElementById('settingsEmailMain').value = current.email;
        if (document.getElementById('settingsThemeMain')) document.getElementById('settingsThemeMain').value = current.theme;
    }
  }

  if (navDashboard) {
    navDashboard.addEventListener('click', () => {
        if (currentView !== 'dashboard') {
            currentView = 'dashboard';
            updateView();
        }
    });
  }

  if (navVital) {
    navVital.addEventListener('click', () => {
        if (currentView !== 'vital') {
            currentView = 'vital';
            updateView();
        }
    });
  }

  if (navToday) {
    navToday.addEventListener('click', () => {
        if (currentView !== 'today') {
            currentView = 'today';
            updateView();
        }
    });
  }

  if (navCategories) {
    navCategories.addEventListener('click', () => {
        if (currentView !== 'categories') {
            currentView = 'categories';
            updateView();
        }
    });
  }

  if (navSettings) {
    navSettings.addEventListener('click', () => {
        if (currentView !== 'settings') {
            currentView = 'settings';
            updateView();
        }
    });
  }

  // ================= ABOUT MODAL LOGIC =================
  const landingAboutBtn = document.getElementById('landingAboutBtn');
  const aboutOverlay = document.getElementById('aboutOverlay');
  const closeAboutBtn = document.getElementById('closeAboutBtn');

  if (landingAboutBtn) {
      landingAboutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (aboutOverlay) {
              aboutOverlay.classList.add('active');
          }
      });
  }

  if (closeAboutBtn) {
      closeAboutBtn.addEventListener('click', () => {
          if (aboutOverlay) {
              aboutOverlay.classList.remove('active');
          }
      });
  }

  if (aboutOverlay) {
      aboutOverlay.addEventListener('click', (e) => {
          if (e.target === aboutOverlay) {
              aboutOverlay.classList.remove('active');
          }
      });
  }

  // ================= FOOTER MODAL LOGIC =================
  const footerAboutBtn = document.getElementById('footerAboutBtn');
  if (footerAboutBtn) {
      footerAboutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (aboutOverlay) aboutOverlay.classList.add('active');
      });
  }

  const footerContactBtn = document.getElementById('footerContactBtn');
  if (footerContactBtn) {
      footerContactBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (contactOverlay) contactOverlay.classList.add('active');
      });
  }

  const footerHelpBtn = document.getElementById('footerHelpBtn');
  if (footerHelpBtn) {
      footerHelpBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (helpOverlay) helpOverlay.classList.add('active');
      });
  }

  // ================= CONTACT MODAL LOGIC =================
  const landingContactBtn = document.getElementById('landingContactBtn');
  const contactOverlay = document.getElementById('contactOverlay');
  const closeContactBtn = document.getElementById('closeContactBtn');

  if (landingContactBtn) {
      landingContactBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (contactOverlay) {
              contactOverlay.classList.add('active');
          }
      });
  }

  if (closeContactBtn) {
      closeContactBtn.addEventListener('click', () => {
          if (contactOverlay) {
              contactOverlay.classList.remove('active');
          }
      });
  }

  if (contactOverlay) {
      contactOverlay.addEventListener('click', (e) => {
          if (e.target === contactOverlay) {
              contactOverlay.classList.remove('active');
          }
      });
  }

  // ================= HELP MODAL LOGIC =================
  const landingHelpBtn = document.getElementById('landingHelpBtn');
  const helpOverlay = document.getElementById('helpOverlay');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const startChatBtn = document.getElementById('startChatBtn');

  if (landingHelpBtn) {
      landingHelpBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (helpOverlay) {
              helpOverlay.classList.add('active');
          }
      });
  }

  if (closeHelpBtn) {
      closeHelpBtn.addEventListener('click', () => {
          if (helpOverlay) {
              helpOverlay.classList.remove('active');
          }
      });
  }

  if (helpOverlay) {
      helpOverlay.addEventListener('click', (e) => {
          if (e.target === helpOverlay) {
              helpOverlay.classList.remove('active');
          }
      });
  }

  if (startChatBtn) {
      startChatBtn.addEventListener('click', () => {
          alert("Connecting you to a support agent... (This is a demo feature)");
      });
  }

  // ================= HELP SEARCH LOGIC =================
  const helpSearchInput = document.querySelector('.help-search input');
  
  if (helpSearchInput) {
      helpSearchInput.addEventListener('input', (e) => {
          const searchTerm = e.target.value.toLowerCase().trim();
          const faqItems = document.querySelectorAll('.help-modal .faq-item');
          
          faqItems.forEach(item => {
              const question = item.querySelector('h4').innerText.toLowerCase();
              const answer = item.querySelector('p').innerText.toLowerCase();
              
              if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                  item.style.display = 'block';
              } else {
                  item.style.display = 'none';
              }
          });
      });
  }

  // ================= POPUP LOGIC =================
  const btn = document.querySelector(".btn");
  const overlay = document.getElementById("overlay");
  const closeBtn = document.querySelector(".close");
  const submitBtn = document.querySelector(".submit-btn");

  if (btn) {
    btn.addEventListener("click", () => {
      overlay.classList.add("active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.remove("active");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  }

  // ================= ADD TASK LOGIC =================
  if (submitBtn) {
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      
      const taskNameInput = document.getElementById('taskName');
      const descriptionInput = document.getElementById('taskDesc');
      const dateInput = document.getElementById('taskDate');
      const priorityInput = document.getElementById('taskPriority');
      const categoryInput = document.getElementById('taskCategory');

      const taskName = taskNameInput.value.trim();
      const description = descriptionInput.value.trim();
      const date = dateInput.value;
      const priority = priorityInput.value;
      const category = categoryInput.value;

      if (!taskName) {
        alert("Please enter a task name!");
        return;
      }

      // Add task to array
      const newTask = {
        name: taskName,
        description: description,
        priority: priority,
        date: date,
        category: category,
        status: 'Pending'
      };
      tasks.push(newTask);
      
      // Save to localStorage
      saveTasks();

      // Re-render all tasks
      renderAllTasks();

      // Clear form
      taskNameInput.value = "";
      descriptionInput.value = "";
      dateInput.value = "";
      priorityInput.selectedIndex = 0;
      categoryInput.selectedIndex = 0;

      overlay.classList.remove("active");
    });
  }

  // ================= CREATE TASK ELEMENT =================
  function createTaskElement(taskName, description, priority, status, date, category, taskIndex) {
    console.log('Creating element - Name:', taskName, 'Desc:', description, 'Priority:', priority, 'Status:', status, 'Date:', date, 'Category:', category);
    
    const taskDiv = document.createElement("div");
    taskDiv.className = "addtaskin";
    taskDiv.setAttribute('data-task-index', taskIndex);

    let statusColor = "green";
    if (priority === "High") statusColor = "red";
    else if (priority === "Medium") statusColor = "orange";

    // Status indicator color
    let statusIndicatorColor = "#3b82f6"; // Default Blue (Pending)
    if (status === "Completed") statusIndicatorColor = "green";
    else if (status === "In Progress") statusIndicatorColor = "#ef4444"; // Red

    // Add completed class for styling
    if (status === "Completed") {
      taskDiv.classList.add('completed-task');
    }

    const innerHTML = `
      <button class="edit-btn" data-index="${taskIndex}" title="Edit Task">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="delete-btn" data-index="${taskIndex}" title="Delete Task">
        <i class="fa-solid fa-trash"></i>
      </button>
      <div class="yo">
        <div class="showstatus" style="border-color: ${statusColor}"></div>
        <div class="title">
          <h4>${taskName}</h4>
        </div>
      </div>
      <div class="discription">
        <h6>${description || "No description provided"}</h6>
      </div>
      ${date ? `<div class="task-date"><i class="fa-regular fa-calendar"></i> ${new Date(date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</div>` : ''}
      ${category ? `<div class="task-date" style="margin-top: 5px; color: #6366f1;"><i class="fa-solid fa-tag"></i> ${category}</div>` : ''}
      <div class="howmuch">
        <div class="state">
          <div class="statustext">
            <h4>Status:</h4>
          </div>
          <div class="kitna">
            <p style="color: ${statusIndicatorColor}; font-weight: 600;">${status}</p>
          </div>
        </div>
        <div class="priority">
          <div class="prioritytext">
            <h4>Priority:</h4>
          </div>
          <div class="kitna2">
            <p>${priority}</p>
          </div>
        </div>
      </div>
    `;
    
    taskDiv.innerHTML = innerHTML;

    return taskDiv;
  }

  // ================= AI SMART ADD =================
  function parseSmartInput(text) {
      let taskName = text;
      
      // Remove conversational prefixes
      const prefixes = [
          /^(please\s+)?(can\s+you\s+)?(add|create|make|schedule)\s+(a\s+)?(new\s+)?(task\s+)?(to\s+)?/i,
          /^new\s+task\s+/i,
          /^(remind\s+me\s+to\s+)/i,
          /^(i\s+need\s+to\s+)/i,
          /^(don'?t\s+forget\s+to\s+)/i
      ];
      prefixes.forEach(prefix => taskName = taskName.replace(prefix, ''));
      taskName = taskName.trim();

      let priority = 'Medium'; // Default
      let category = 'Miscellaneous'; // Default
      let date = '';

      // 1. Parse Priority: !high, !medium, !low
      const priorityRegex = /!(high|medium|low)\b/i;
      const priorityMatch = taskName.match(priorityRegex);
      if (priorityMatch) {
          const p = priorityMatch[1].toLowerCase();
          if (p === 'high') priority = 'High';
          else if (p === 'medium') priority = 'Medium';
          else if (p === 'low') priority = 'Low';
          taskName = taskName.replace(priorityRegex, '').trim();
      }

      // 1.5 Parse "imp" or "important" for High Priority
      const impRegex = /\b(imp|important)\b/i;
      if (taskName.match(impRegex)) {
          priority = 'High';
          taskName = taskName.replace(impRegex, '').trim();
      }

      // 2. Parse Category: #work, #school
      const categoryRegex = /#([a-zA-Z0-9]+)\b/;
      const categoryMatch = taskName.match(categoryRegex);
      if (categoryMatch) {
          category = categoryMatch[1].charAt(0).toUpperCase() + categoryMatch[1].slice(1);
          taskName = taskName.replace(categoryRegex, '').trim();
      }

      // 3. Parse Date: today, tomorrow
      const tomorrowRegex = /\b(tomorrow)\b/i;
      const todayRegex = /\b(today)\b/i;
      
      if (taskName.match(tomorrowRegex)) {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          taskName = taskName.replace(tomorrowRegex, '').replace(/\b(by|on|at)\b/gi, '').trim();
      } else if (taskName.match(todayRegex)) {
          const d = new Date();
          date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          taskName = taskName.replace(todayRegex, '').replace(/\b(by|on|at)\b/gi, '').trim();
      }
      
      // Clean up remaining prepositions and extra spaces
      taskName = taskName.replace(/\s{2,}/g, ' ').trim();
      taskName = taskName.replace(/^(by|on|at)\s/i, '').trim();

      // Generate AI Description
      let aiDescription = "Task automatically added by your AI assistant.";
      if (priority === 'High') {
          aiDescription = "This is a high-priority task. Focus on completing this soon!";
      }

      return {
          name: taskName,
          description: aiDescription,
          priority: priority,
          date: date,
          category: category,
          status: 'Pending'
      };
  }

  // ================= EDIT TASK STATUS FUNCTIONALITY =================
  const editOverlay = document.getElementById('editOverlay');
  const editCancelBtn = document.getElementById('editCancelBtn');
  const editSaveBtn = document.getElementById('editSaveBtn');
  const editStatusSelect = document.getElementById('editStatusSelect');
  const editTaskName = document.getElementById('editTaskName');
  const editTaskDesc = document.getElementById('editTaskDesc');
  const editTaskPriority = document.getElementById('editTaskPriority');
  let taskToEdit = null;

  // Open edit modal
  document.addEventListener('click', function(e) {
    const editBtn = e.target.closest('.edit-btn');
    
    if (editBtn) {
      e.stopPropagation();
      e.preventDefault();
      
      const taskCard = editBtn.closest('.addtaskin');
      if (!taskCard) {
        return;
      }
      
      taskToEdit = parseInt(taskCard.getAttribute('data-task-index'));
      
      // Set current status in dropdown
      editTaskName.value = tasks[taskToEdit].name;
      editTaskDesc.value = tasks[taskToEdit].description;
      editTaskPriority.value = tasks[taskToEdit].priority;
      editStatusSelect.value = tasks[taskToEdit].status || 'Pending';
      
      // Show edit modal
      editOverlay.classList.add('active');
    }
  });

  // Cancel edit
  if (editCancelBtn) {
    editCancelBtn.addEventListener('click', () => {
      editOverlay.classList.remove('active');
      taskToEdit = null;
    });
  }

  // Save edit
  if (editSaveBtn) {
    editSaveBtn.addEventListener('click', () => {
      if (taskToEdit !== null) {
        const newName = editTaskName.value.trim();
        const newDesc = editTaskDesc.value.trim();
        const newPriority = editTaskPriority.value;
        const newStatus = editStatusSelect.value;
        const oldStatus = tasks[taskToEdit].status;
        
        if (!newName) {
            alert("Task name cannot be empty");
            return;
        }

        // Update task status
        tasks[taskToEdit].name = newName;
        tasks[taskToEdit].description = newDesc;
        tasks[taskToEdit].priority = newPriority;
        tasks[taskToEdit].status = newStatus;

        // Trigger Notification if completed
        if (newStatus === 'Completed' && oldStatus !== 'Completed') {
            addNotification(`You completed: "${tasks[taskToEdit].name}"`);
        }
        
        // Save to localStorage
        saveTasks();
        
        // Re-render all tasks
        renderAllTasks();
        
        // Close modal
        editOverlay.classList.remove('active');
        taskToEdit = null;
      }
    });
  }

  // Close edit modal when clicking outside
  if (editOverlay) {
    editOverlay.addEventListener('click', (e) => {
      if (e.target === editOverlay) {
        editOverlay.classList.remove('active');
        taskToEdit = null;
      }
    });
  }

  const smartAddBtn = document.getElementById('smartAddBtn');
  const smartInput = document.getElementById('smartInput');

  if (smartAddBtn) {
      smartAddBtn.addEventListener('click', () => {
          const inputText = smartInput.value.trim();
          if (!inputText) return;

          const newTask = parseSmartInput(inputText);
          if (!newTask.name) return;

          tasks.push(newTask);
          saveTasks();
          renderAllTasks();
          addNotification(`AI added task: "${newTask.name}"`);
          smartInput.value = '';
      });

      smartInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') smartAddBtn.click();
      });
  }

  // ================= NOTIFICATION SYSTEM =================
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationList = document.getElementById('notificationList');
  const notificationDot = document.getElementById('notificationDot');
  const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
  const notificationToast = document.getElementById('notificationToast');
  const toastMessage = document.getElementById('toastMessage');

  let notifications = JSON.parse(localStorage.getItem(getStorageKey('todoNotifications'))) || [];

  function saveNotifications() {
    localStorage.setItem(getStorageKey('todoNotifications'), JSON.stringify(notifications));
    updateNotificationUI();
  }

  function addNotification(message) {
    const newNotif = {
        id: Date.now(),
        message: message,
        time: new Date().toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, day: 'numeric', month: 'short' }),
        read: false
    };
    notifications.unshift(newNotif);
    saveNotifications();
    showToast(message);
  }

  function updateNotificationUI() {
    // Update Dot
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notificationDot.classList.add('active');
    } else {
        notificationDot.classList.remove('active');
    }

    // Update List
    notificationList.innerHTML = '';
    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">No new notifications</div>';
    } else {
        notifications.forEach(notif => {
            const div = document.createElement('div');
            div.className = 'notification-item';
            div.innerHTML = `
                <span>${notif.message}</span>
                <span class="notification-time">${notif.time}</span>
            `;
            notificationList.appendChild(div);
        });
    }
  }

  function showToast(msg) {
    if (toastMessage) toastMessage.innerText = msg;
    notificationToast.classList.add('active');
    setTimeout(() => {
        notificationToast.classList.remove('active');
    }, 3000);
  }

  if (notificationBtn) {
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
        // Mark all as read when opened
        if (notificationDropdown.classList.contains('active')) {
            notifications.forEach(n => n.read = true);
            saveNotifications();
        }
    });
  }

  if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', () => {
        notifications = [];
        saveNotifications();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (notificationDropdown && !notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
        notificationDropdown.classList.remove('active');
    }
  });

  // Initialize UI
  updateNotificationUI();

  // ================= DELETE TASK FUNCTIONALITY =================
  const deleteOverlay = document.getElementById('deleteOverlay');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
  let taskToDelete = null;

  // Use event delegation on the parent container
  document.addEventListener('click', function(e) {
    const deleteBtn = e.target.closest('.delete-btn');
    
    if (deleteBtn) {
      e.stopPropagation();
      e.preventDefault();
      
      const taskCard = deleteBtn.closest('.addtaskin');
      if (!taskCard) {
        return;
      }
      
      taskToDelete = parseInt(taskCard.getAttribute('data-task-index'));
      
      // Show custom delete confirmation modal
      deleteOverlay.classList.add('active');
    }
  });

  // Cancel delete
  if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener('click', () => {
      deleteOverlay.classList.remove('active');
      taskToDelete = null;
    });
  }

  // Confirm delete
  if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener('click', () => {
      if (taskToDelete !== null) {
        // Remove from array
        tasks.splice(taskToDelete, 1);
        
        // Save to localStorage
        saveTasks();
        
        // Re-render all tasks
        renderAllTasks();
        
        // Close modal
        deleteOverlay.classList.remove('active');
        taskToDelete = null;
      }
    });
  }

  // Close delete modal when clicking outside
  if (deleteOverlay) {
    deleteOverlay.addEventListener('click', (e) => {
      if (e.target === deleteOverlay) {
        deleteOverlay.classList.remove('active');
        taskToDelete = null;
      }
    });
  }

  // ================= SEARCH FUNCTIONALITY =================
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) return;

    // Remove previous highlights
    document.querySelectorAll('.addtaskin').forEach(task => {
      task.classList.remove('task-highlight');
    });

    const allTasks = document.querySelectorAll('.addtaskin');
    let found = false;

    for (const task of allTasks) {
      const titleElement = task.querySelector('.title h4');
      const descElement = task.querySelector('.discription h6');
      
      const title = titleElement ? titleElement.innerText.toLowerCase() : '';
      const desc = descElement ? descElement.innerText.toLowerCase() : '';

      if (title.includes(searchTerm) || desc.includes(searchTerm)) {
        task.classList.add('task-highlight');
        task.scrollIntoView({ behavior: 'smooth', block: 'center' });
        found = true;
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            task.classList.remove('task-highlight');
        }, 3000);
        
        break; // Focus on the first match
      }
    }

    if (!found) {
      alert("No task found matching: " + searchTerm);
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // ================= SEARCH SUGGESTIONS =================
  const suggestionsBox = document.getElementById('suggestionsBox');

  if (searchInput && suggestionsBox) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value.toLowerCase().trim();
      suggestionsBox.innerHTML = '';
      
      if (value.length === 0) {
        suggestionsBox.classList.remove('active');
        return;
      }

      const filteredTasks = tasks.filter(task => 
        task.name.toLowerCase().includes(value) || 
        (task.description && task.description.toLowerCase().includes(value))
      );

      if (filteredTasks.length > 0) {
        filteredTasks.forEach(task => {
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          div.innerHTML = `
            <span style="font-weight: 500; color: #333;">${task.name}</span>
            <span style="font-size: 0.75rem; padding: 2px 8px; border-radius: 10px; background: #f0f0f0; color: #666;">${task.status || 'Pending'}</span>
          `;
          
          div.addEventListener('click', () => {
            searchInput.value = task.name;
            suggestionsBox.classList.remove('active');
            performSearch();
          });
          
          suggestionsBox.appendChild(div);
        });
        suggestionsBox.classList.add('active');
      } else {
        suggestionsBox.classList.remove('active');
      }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.remove('active');
      }
    });
  }

  // ================= CALENDAR LOGIC =================
  const navCalendarBtn = document.getElementById('navCalendarBtn');
  const calendarOverlay = document.getElementById('calendarOverlay');
  const closeCalendarBtn = document.getElementById('closeCalendarBtn');
  const calendarMonthYear = document.getElementById('calendarMonthYear');
  const calendarDays = document.getElementById('calendarDays');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

  let currentCalendarDate = new Date();

  function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    calendarMonthYear.innerText = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    calendarDays.innerHTML = '';
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
        const div = document.createElement('div');
        div.classList.add('calendar-day', 'empty');
        calendarDays.appendChild(div);
    }
    
    // Days of current month
    const today = new Date();
    
    for (let i = 1; i <= lastDay; i++) {
        const div = document.createElement('div');
        div.classList.add('calendar-day');
        div.innerText = i;
        
        // Check if it's today
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            div.classList.add('today');
        }
        
        // Check for tasks on this date
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasTask = tasks.some(task => task.date === dateString);
        
        if (hasTask) {
            const dot = document.createElement('div');
            dot.classList.add('task-dot');
            div.appendChild(dot);
        }
        
        calendarDays.appendChild(div);
    }
  }

  if (navCalendarBtn && calendarOverlay) {
    navCalendarBtn.addEventListener('click', () => {
        renderCalendar();
        calendarOverlay.classList.add('active');
    });
  }
  
  if (closeCalendarBtn) {
    closeCalendarBtn.addEventListener('click', () => {
        calendarOverlay.classList.remove('active');
    });
  }
  
  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
  }
  
  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });
  }
  
  if (calendarOverlay) {
      calendarOverlay.addEventListener('click', (e) => {
          if (e.target === calendarOverlay) {
              calendarOverlay.classList.remove('active');
          }
      });
  }

  // ================= SETTINGS LOGIC =================
  const settingsSaveBtnMain = document.getElementById('settingsSaveBtnMain');
  
  const settingsNameInput = document.getElementById('settingsNameMain');
  const settingsEmailInput = document.getElementById('settingsEmailMain');
  const settingsThemeSelect = document.getElementById('settingsThemeMain');
  const settingsProfilePicInput = document.getElementById('settingsProfilePicMain');

  const profileName = document.querySelector('.sidebar .name');
  const profileEmail = document.querySelector('.sidebar .email');
  const greetName = document.querySelector('.greet h3');

  // Load settings
  function loadSettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(getStorageKey('userSettings')));
    } catch (e) {
        console.error("Error parsing settings from localStorage:", e);
    }

    if (!settings) {
        settings = {
            name: 'Task',
            email: 'Task@1234',
            theme: 'light',
            profilePic: null
        };
    }

    // Apply settings
    if (profileName) profileName.innerText = settings.name;
    if (profileEmail) profileEmail.innerText = settings.email;
    if (greetName) greetName.innerText = `Welcome Back, ${settings.name}`;
    
    const profileDiv = document.querySelector('.profile');
    if (profileDiv && settings.profilePic) {
        profileDiv.style.backgroundImage = `url('${settings.profilePic}')`;
    }
    
    if (settings.theme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    return settings;
  }

  let currentSettings = loadSettings();


  if (settingsSaveBtnMain) {
    settingsSaveBtnMain.addEventListener('click', () => {
        const newName = settingsNameInput.value.trim();
        const newEmail = settingsEmailInput.value.trim();
        const newTheme = settingsThemeSelect.value;

        if (!newName || !newEmail) {
            alert("Name and Email cannot be empty.");
            return;
        }

        const saveSettings = (picUrl) => {
            currentSettings = {
                name: newName,
                email: newEmail,
                theme: newTheme,
                profilePic: picUrl || currentSettings.profilePic
            };

            try {
                localStorage.setItem(getStorageKey('userSettings'), JSON.stringify(currentSettings));
                loadSettings(); // Re-apply settings
                alert("Settings saved successfully!");
                if (settingsProfilePicInput) settingsProfilePicInput.value = '';
            } catch (e) {
                alert("Failed to save settings. Image might be too large.");
                console.error(e);
            }
        };

        if (settingsProfilePicInput && settingsProfilePicInput.files && settingsProfilePicInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                saveSettings(e.target.result);
            };
            reader.readAsDataURL(settingsProfilePicInput.files[0]);
        } else {
            saveSettings(null);
        }
    });
  }

  // ================= LANDING PAGE LOGIC =================
  const landingPage = document.getElementById('landingPage');
  const landingBtn = document.getElementById('landingBtn');

  if (landingBtn && landingPage) {
      landingBtn.addEventListener('click', () => {
          handleLogin();
      });
  }

  // ================= LOGIN LOGIC =================
  const loginBtn = document.querySelector('.login-btn');
  const footerLoginLink = document.querySelector('.landing-footer-links a');
  const loginOverlay = document.getElementById('loginOverlay');
  const loginCancelBtn = document.getElementById('loginCancelBtn');
  const loginConfirmBtn = document.getElementById('loginConfirmBtn');
  const loginEmailInput = document.getElementById('loginEmailInput');
  const loginPasswordInput = document.getElementById('loginPasswordInput');
  const togglePassword = document.getElementById('togglePassword');

  if (togglePassword) {
      togglePassword.addEventListener('click', function () {
          // toggle the type attribute
          const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          loginPasswordInput.setAttribute('type', type);
          
          // toggle the eye / eye-slash icon
          this.classList.toggle('fa-eye');
          this.classList.toggle('fa-eye-slash');
      });
  }

  const forgotPassBtn = document.getElementById('forgotPassBtn');
  if (forgotPassBtn) {
      forgotPassBtn.addEventListener('click', (e) => {
          e.preventDefault();
          alert("Password reset instructions have been sent to your email.");
      });
  }

  function handleLogin(e) {
      if (e) e.preventDefault();
      loginOverlay.classList.add('active');
  }

  if (loginCancelBtn) {
      loginCancelBtn.addEventListener('click', () => {
          loginOverlay.classList.remove('active');
      });
  }

  if (loginConfirmBtn) {
      loginConfirmBtn.addEventListener('click', () => {
          const email = loginEmailInput.value.trim();
          const password = loginPasswordInput.value.trim();

          if (!email || !password) {
              alert("Please enter both email and password.");
              return;
          }

          const validUsers = {
              'task@gmail.com': 'task@1234'
          };

          if (validUsers[email] && validUsers[email] === password) {
              // Simulate Login
              currentUserEmail = email;
              localStorage.setItem('currentUserEmail', currentUserEmail);
              
              // Reload data for this user
              loadTasks();
              currentSettings = loadSettings();
              notifications = JSON.parse(localStorage.getItem(getStorageKey('todoNotifications'))) || [];
              updateNotificationUI();

              loginOverlay.classList.remove('active');
              landingPage.classList.add('hide');
              
              addNotification(`Welcome back, ${currentSettings.name}!`);
          } else {
              alert("Invalid email or password!");
          }
      });
  }

  if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
  }

  if (footerLoginLink) {
      footerLoginLink.addEventListener('click', handleLogin);
  }

  // ================= LOGOUT LOGIC =================
  const logoutBtn = document.querySelector('.logout');
  const logoutOverlay = document.getElementById('logoutOverlay');
  const logoutCancelBtn = document.getElementById('logoutCancelBtn');
  const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');

  if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
          logoutOverlay.classList.add('active');
      });
  }

  if (logoutCancelBtn) {
      logoutCancelBtn.addEventListener('click', () => {
          logoutOverlay.classList.remove('active');
      });
  }

  if (logoutConfirmBtn) {
      logoutConfirmBtn.addEventListener('click', () => {
          logoutOverlay.classList.remove('active');
          
          // Clear user session
          localStorage.removeItem('currentUserEmail');
          currentUserEmail = null;
          
          // Reload default data (optional, or just show landing page)
          
          // Show landing page
          landingPage.classList.remove('hide');
          addNotification("You have been logged out.");
      });
  }

  // ================= SIDEBAR TOGGLE =================
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.querySelector('.sidebar');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          sidebar.classList.toggle('active');
      });

      if (closeSidebarBtn) {
          closeSidebarBtn.addEventListener('click', () => {
              sidebar.classList.remove('active');
          });
      }

      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
          if (window.innerWidth <= 768 && 
              sidebar.classList.contains('active') && 
              !sidebar.contains(e.target) && 
              e.target !== menuBtn) {
              sidebar.classList.remove('active');
          }
      });

      // Close sidebar when clicking a link inside it
      const sidebarLinks = sidebar.querySelectorAll('li, .logout');
      sidebarLinks.forEach(link => {
          link.addEventListener('click', () => {
              if (window.innerWidth <= 768) {
                  sidebar.classList.remove('active');
              }
          });
      });
  }

  // Load tasks when page loads
  loadTasks();
});
