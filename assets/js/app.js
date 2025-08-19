let cwd = ['home'];

function getNode(pathArr) {
  let node = window.FileSystem;
  for (let part of pathArr) {
    if (node[part] && node[part].type === 'dir') {
      node = node[part].children;
    } else if (node.children && node.children[part]) {
      node = node.children[part];
    } else {
      return null;
    }
  }
  return node;
}

document.addEventListener('DOMContentLoaded', () => {
  const config = window.WebShellConfig;
  const { commands: baseCommands, htmlBlock } = window.TerminalCommands;

  const output = document.getElementById('output');
  const commandInput = document.getElementById('command-input');
  const executeBtn = document.getElementById('execute');
  const historyPanel = document.getElementById('history-panel');
  const historyList = document.getElementById('history-list');
  const clock = document.getElementById('clock');
  const cwdPrompt = document.getElementById('cwd-prompt');

  let commandHistory = [];
  let historyIndex = -1;

  function sanitize(s) {
    return s.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function scrollToBottom() { output.scrollTop = output.scrollHeight; }

  function getPrompt() {
    return `<span class="text-green-400">user@portfolio:/${cwd.join('/')}$</span>`;
  }

  function updateCwdPrompt() {
    if (cwdPrompt) cwdPrompt.innerHTML = `user@portfolio:/${cwd.join('/')}$`;
  }

  function updateHistoryPanel() {
    historyList.innerHTML = '';
    commandHistory.forEach((cmd) => {
      const item = document.createElement('div');
      item.className = 'history-item p-2 hover:bg-gray-700';
      item.textContent = cmd;
      item.addEventListener('click', () => {
        commandInput.value = cmd;
        historyPanel.classList.add('hidden');
        commandInput.focus();
      });
      historyList.appendChild(item);
    });
  }

  const commands = {
    ...baseCommands,
    pwd: {
      description: 'Show current directory',
      execute: () => '/' + cwd.join('/')
    },
    ls: {
      description: 'List directory contents',
      execute: () => {
        let dir = getNode(cwd);
        if (!dir) return 'Directory not found';
        let items = Object.entries(dir)
          .map(([k, v]) => v.type === 'dir' ? `<span class="text-blue-400">${k}/</span>` : `<span class="text-gray-400">${k}</span>`);
        return items.join('  ');
      }
    },
    cd: {
      description: 'Change directory',
      execute: (args) => {
        if (args.length === 0) { cwd = ['home']; updateCwdPrompt(); return '/home'; }
        let target = args[0];
        if (target === '..') {
          if (cwd.length > 1) cwd.pop();
          updateCwdPrompt();
          return '/' + cwd.join('/');
        }
        let curr = getNode(cwd);
        if (curr && curr[target] && curr[target].type === 'dir') {
          cwd.push(target);
          updateCwdPrompt();
          return '/' + cwd.join('/');
        }
        return `cd: no such directory: ${target}`;
      }
    },
    cat: {
      description: 'Show file contents',
      execute: (args) => {
        if (args.length === 0) return 'Usage: cat <file>';
        let dir = getNode(cwd);
        const file = dir && dir[args[0]];
        if (file && file.type === 'file') return file.content.replace(/\n/g,'<br/>');
        return `cat: ${args}: No such file`;
      }
    }
  };

  function executeCommand(input) {
    if (!input.trim()) return;
    commandHistory.unshift(input);
    if (commandHistory.length > config.MAX_HISTORY) commandHistory.pop();
    updateHistoryPanel();

    const commandElement = document.createElement('div');
    commandElement.className = 'mt-2';
    commandElement.innerHTML = `${getPrompt()}<span class="ml-2">${sanitize(input)}</span>`;
    output.appendChild(commandElement);

    const parts = input.split(' ').filter(Boolean);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (commands[command]) {
      const cmd = commands[command];
      if (cmd.execute.constructor.name === 'AsyncFunction') {
        cmd.execute(args).then(res => {
          if (res) {
            const el = document.createElement('div');
            el.className = 'mt-1 mb-2 text-gray-300';
            el.innerHTML = htmlBlock(res);
            output.appendChild(el);
          }
          scrollToBottom();
        }).catch(err => {
          const el = document.createElement('div');
          el.className = 'mt-1 mb-2 text-red-400';
          el.textContent = `Error: ${err.message}`;
          output.appendChild(el);
          scrollToBottom();
        });
      } else {
        const res = cmd.execute(args);
        if (res) {
          const el = document.createElement('div');
          el.className = 'mt-1 mb-2 text-gray-300';
          el.innerHTML = htmlBlock(res);
          output.appendChild(el);
        }
        scrollToBottom();
      }
    } else {
      const el = document.createElement('div');
      el.className = 'mt-1 mb-2 text-gray-300';
      el.textContent = `Command not found: ${command}`;
      output.appendChild(el);
      scrollToBottom();
    }
  }

  function updateClock() {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    const time = now.toLocaleTimeString(undefined, { hour12: false });
    clock.textContent = `${date}  ${time}`;
  }
  updateClock();
  setInterval(updateClock, config.CLOCK_UPDATE_MS);

  executeBtn.addEventListener('click', () => {
    const input = commandInput.value.trim();
    executeCommand(input);
    commandInput.value = '';
    historyPanel.classList.add('hidden');
    updateCwdPrompt();
  });

  commandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const input = commandInput.value.trim();
      executeCommand(input);
      commandInput.value = '';
      historyPanel.classList.add('hidden');
      updateCwdPrompt();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        commandInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex <= 0) {
        historyIndex = -1;
        commandInput.value = '';
      } else {
        historyIndex--;
        commandInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const input = commandInput.value.trim();
      if (!input) return;
      const matching = Object.keys(commands).filter(c => c.startsWith(input.toLowerCase()));
      if (matching.length === 1) {
        commandInput.value = matching[0] + ' ';
      } else if (matching.length > 1) {
        const el = document.createElement('div');
        el.className = 'mt-1 mb-2 text-gray-300';
        el.innerHTML = matching.join('  ');
        output.appendChild(el);
        scrollToBottom();
      }
    }
  });

  commandInput.addEventListener('input', () => {
    if (commandInput.value.trim() && commandHistory.length > 0) {
      historyPanel.classList.remove('hidden');
    } else {
      historyPanel.classList.add('hidden');
    }
  });

  document.querySelectorAll('[data-go]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = a.getAttribute('data-go');
      executeCommand(`cd ${sec}`);
      executeCommand(`cat ${sec}.txt`);
      updateCwdPrompt();
    });
  });

  document.getElementById('minimize').addEventListener('click', () => {
    output.innerHTML += '<div class="text-gray-500">Window minimized (simulated)</div>';
    scrollToBottom();
  });
  document.getElementById('maximize').addEventListener('click', () => {
    output.innerHTML += '<div class="text-gray-500">Window maximized (simulated)</div>';
    scrollToBottom();
  });
  document.getElementById('close').addEventListener('click', () => {
    output.innerHTML += '<div class="text-gray-500">Closing terminal (simulated)</div>';
    scrollToBottom();
    setTimeout(() => {
      output.innerHTML += '<div class="text-red-400">Session ended</div>';
      commandInput.disabled = true;
    }, 500);
  });

  updateCwdPrompt();
  commandInput.focus();
});
// Prevent body scroll during card drag
document.addEventListener('DOMContentLoaded', () => {
  // Add CSS for preventing scroll
  const style = document.createElement('style');
  style.textContent = `
    .noscroll {
      overflow: hidden !important;
      position: fixed !important;
      width: 100% !important;
      height: 100% !important;
    }
  `;
  document.head.appendChild(style);

  // Add event listeners to the card
  const card = document.getElementById('badgeCard');
  if (card) {
    card.addEventListener('pointerdown', () => {
      document.body.classList.add('noscroll');
    });
    
    window.addEventListener('pointerup', () => {
      document.body.classList.remove('noscroll');
    });
    
    window.addEventListener('pointercancel', () => {
      document.body.classList.remove('noscroll');
    });

    // Also handle touch events for mobile
    card.addEventListener('touchstart', () => {
      document.body.classList.add('noscroll');
    });
    
    window.addEventListener('touchend', () => {
      document.body.classList.remove('noscroll');
    });
  }
});
