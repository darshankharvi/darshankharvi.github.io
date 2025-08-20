window.TerminalCommands = (function() {
  const resume = window.ResumeData;

  function htmlBlock(text) {
    return String(text).replace(/\n/g, "<br/>");
  }

  let processes = [];
  let currentProcessId = 0;

  class Process {
    constructor(id, command, status = 'running') {
      this.id = id;
      this.command = command;
      this.status = status;
      this.startTime = new Date();
      this.endTime = null;
    }
    terminate() {
      this.status = 'terminated';
      this.endTime = new Date();
    }
  }

  const commands = {
    help: {
      description: 'Show this help message',
      execute: () => {
        const help = [
          ["help", "Show available commands"],
          ["clear", "Clear the terminal screen"],
          ["echo <text>", "Display a line of text"],
          ["date", "Show current date and time"],
          ["whoami", "Display current user information"],
          ["pwd", "Show current directory"],
          ["ls", "List directory contents"],
          ["cat <file>", "Show file contents"],
          ["grep <pattern>", "Search for keywords in resume"],
          ["sleep <seconds>", "Delay for a specified amount of seconds"]
        ];
        let html = '<div class="mb-2">Available commands:</div>';
        html += '<div class="grid grid-cols-2 gap-2">';
        help.forEach(([c, d]) => {
          html += `<div class="text-green-400">${c}</div><div class="text-gray-300">${d}</div>`;
        });
        html += '</div>';
        return html;
      }
    },


    clear: {
      description: 'Clear the terminal screen',
      execute: () => {
        const output = document.getElementById('output');
        if (output) output.innerHTML = '';
        return '';
      }
    },

    echo: {
      description: 'Display a line of text',
      execute: (args) => args.join(' ')
    },

    date: {
      description: 'Show current date and time',
      execute: () => new Date().toString()
    },

    whoami: {
      description: 'Display current user information',
      execute: () => {
        return `<div class="space-y-1">
          <div><span class="text-green-400">User:</span> darshan</div>
          <div><span class="text-green-400">Full Name:</span> Darshan Durga Kharvi</div>
          <div><span class="text-green-400">Role:</span> CSE Student & Cybersecurity Enthusiast</div>
          <div><span class="text-green-400">Specialization:</span> Digital Forensics & Ethical Hacking</div>
          <div><span class="text-green-400">Location:</span> Bengaluru, India</div>
          <div><span class="text-green-400">Status:</span> Actively seeking cybersecurity opportunities</div>
        </div>`;
      }
    },

    grep: {
      description: 'Search for patterns in resume',
      execute: (args) => {
        if (args.length === 0) return 'Usage: grep [pattern]';
        const pattern = args.join(' ');
        let regex;
        try {
          regex = new RegExp(pattern, 'gi');
        } catch (e) {
          return 'grep: invalid regex';
        }
        const text = getResumeText();
        const matches = text.match(regex);
        if (!matches) return 'No matches found';
        const lines = text.split('\n').map(line => {
          if (!regex.test(line)) {
            regex.lastIndex = 0;
            return null;
          }
          regex.lastIndex = 0;
          return line.replace(regex, m => `<span class="bg-yellow-500 text-black">${m}</span>`);
        }).filter(Boolean);
        return lines.join('<br/>');
      }
    },

    sleep: {
      description: 'Delay for a specified amount of seconds',
      execute: async (args) => {
        if (args.length === 0) return 'Usage: sleep [seconds]';
        const seconds = parseFloat(args[0]);
        if (isNaN(seconds) || seconds <= 0) return 'sleep: invalid time interval';
        const pid = ++currentProcessId;
        const process = new Process(pid, `sleep ${seconds}`);
        processes.push(process);
        await new Promise(res => setTimeout(res, seconds * 1000));
        process.terminate();
        return `Slept for ${seconds} seconds`;
      }
    }
  };

  function getResumeText() {
    const lines = [];
    lines.push(resume.about);
    resume.projects.forEach(p => lines.push(p.name + " - " + p.details));
    lines.push("Skills: " + resume.skills.join(", "));
    resume.experience.forEach(e => lines.push(`${e.role} @ ${e.org} (${e.time}) - ${e.desc}`));
    resume.education.forEach(ed => lines.push(`${ed.degree} - ${ed.school} (${ed.year})`));
    lines.push("Certifications: " + resume.certifications.join(", "));
    lines.push("Leadership: " + resume.leadership.join(" | "));
    lines.push(`Contact: ${resume.contact.name}, ${resume.contact.phone}, ${resume.contact.email}, ${resume.contact.location}, ${resume.contact.linkedin}`);
    return lines.join("\n");
  }

  return {
    commands,
    htmlBlock,
    getResumeText
  };
})();
