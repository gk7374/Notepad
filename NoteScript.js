document.addEventListener('DOMContentLoaded', (event) => {
  let notes = JSON.parse(localStorage.getItem('notes')) || [];
  const toggleModeCheckbox = document.getElementById('toggleModeCheckbox');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resetModal = document.getElementById('resetModal');
  const confirmResetBtn = document.getElementById('confirmResetBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const closeModal = document.querySelector('.modal .close');
  const colorOptions = document.querySelectorAll('.color-option');
  const openColorBar = document.getElementById('openColorBar');
  const closeColorBar = document.getElementById('closeColorBar');
  const colorBar = document.getElementById('colorBar');
  const hamburger = document.querySelector('.hamburger');
  let editIndex = -1;
  let undoStack = [];
  let redoStack = [];
  const maxHistory = 20;

  function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
  }

  function formatDate(date) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
  }

  function renderNotes() {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = '';
    notes.forEach((note, index) => {
      const noteCard = document.createElement('div');
      noteCard.className = 'note';
      noteCard.setAttribute('draggable', 'true');
      noteCard.setAttribute('data-index', index);
      noteCard.innerHTML = `
        <p class="note-text" style="line-break: anywhere;">${note.text}</p>
        <small class="note-date">${note.date}</small>
        <div class="card-actions">
          <button class="edit-note" data-index="${index}"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="delete-note" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
          <button class="copy-note" data-index="${index}"><i class="fa-solid fa-clone"></i></button>
        </div>
      `;
      notesContainer.appendChild(noteCard);
    });

    addDragAndDropEvents();
    updateUndoRedoButtons();
  }

  function addDragAndDropEvents() {
    const noteCard = document.querySelector('.note-card');

    noteCard.addEventListener('dragstart', (e) => {
      noteCard.classList.add('dragging');
      e.dataTransfer.setData('text/plain', '');
    });

    noteCard.addEventListener('dragend', () => {
      noteCard.classList.remove('dragging');
    });

    const container = document.querySelector('.container');
    const notesContainer = document.getElementById('notesContainer');

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingNote = document.querySelector('.dragging');
      const afterElement = getDragAfterElement(container, e.clientX);
      if (afterElement == null) {
        container.insertBefore(draggingNote, notesContainer);
      } else {
        container.insertBefore(draggingNote, afterElement);
      }
    });

    container.addEventListener('drop', () => {
      const draggingNote = document.querySelector('.dragging');
      draggingNote.style.left = `${draggingNote.getBoundingClientRect().left}px`;
      draggingNote.classList.remove('dragging');
    });
  }

  function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.note-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = x - box.left - box.width / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function addToUndoStack() {
    undoStack.push(JSON.stringify(notes));
    if (undoStack.length > maxHistory) {
      undoStack.shift();
    }
    redoStack = [];
  }

  document.getElementById('addNoteBtn').addEventListener('click', () => {
    const noteText = document.getElementById('noteText').value;
    if (noteText.trim()) {
      addToUndoStack();
      const date = new Date();
      const dateString = formatDate(date);

      if (editIndex === -1) {
        notes.push({ text: noteText, date: dateString });
      } else {
        notes[editIndex].text = noteText;
        notes[editIndex].date = dateString;
        editIndex = -1;
      }

      document.getElementById('noteText').value = '';
      saveNotes();
      renderNotes();
    }
  });

  document.getElementById('notesContainer').addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-note') || event.target.closest('.delete-note')) {
      addToUndoStack();
      const index = event.target.closest('.delete-note').getAttribute('data-index');
      notes.splice(index, 1);
      saveNotes();
      renderNotes();
    } else if (event.target.classList.contains('edit-note') || event.target.closest('.edit-note')) {
      const index = event.target.closest('.edit-note').getAttribute('data-index');
      document.getElementById('noteText').value = notes[index].text;
      editIndex = index;
    } else if (event.target.classList.contains('copy-note') || event.target.closest('.copy-note')) {
      const index = event.target.closest('.copy-note').getAttribute('data-index');
      copyNote(index);
    }
  });

  function copyNote(index) {
    addToUndoStack();
    const noteToCopy = notes[index];
    const newNote = {
      text: noteToCopy.text,
      date: formatDate(new Date())
    };
    notes.push(newNote);
    saveNotes();
    renderNotes();
  }

  undoBtn.addEventListener('click', () => {
    if (undoStack.length > 0) {
      redoStack.push(JSON.stringify(notes));
      notes = JSON.parse(undoStack.pop());
      saveNotes();
      renderNotes();
    }
    updateUndoRedoButtons();
  });

  redoBtn.addEventListener('click', () => {
    if (redoStack.length > 0) {
      undoStack.push(JSON.stringify(notes));
      notes = JSON.parse(redoStack.pop());
      saveNotes();
      renderNotes();
    }
    updateUndoRedoButtons();
  });

  resetBtn.addEventListener('click', () => {
    resetModal.style.display = 'block';
  });

  confirmResetBtn.addEventListener('click', () => {
    notes = [];
    undoStack = [];
    redoStack = [];
    saveNotes();
    renderNotes();
    resetModal.style.display = 'none';
  });

  cancelResetBtn.addEventListener('click', () => {
    resetModal.style.display = 'none';
  });

  closeModal.addEventListener('click', () => {
    resetModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target == resetModal) {
      resetModal.style.display = 'none';
    }
  });

  toggleModeCheckbox.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
    document.querySelectorAll('.card').forEach(card => {
      card.classList.toggle('dark-mode');
    });
  });

  colorOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const color = e.target.getAttribute('data-color');
      document.body.style.backgroundColor = color;
    });
  });

  hamburger.addEventListener('click', () => {
    colorBar.classList.toggle('active');
    hamburger.classList.toggle('hide');
  });

  closeColorBar.addEventListener('click', () => {
    colorBar.classList.remove('active');
    hamburger.classList.remove('hide');
  });

  function updateUndoRedoButtons() {
    undoBtn.disabled = undoStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
  }

  renderNotes();
  updateUndoRedoButtons();
});
