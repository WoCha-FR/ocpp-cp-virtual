export const htmlFooter = `
    <footer class="footer mt-auto py-0">
      <div class="container-fluid text-center">
        <textarea readonly class="form-control form-control-sm" id="reslogs" rows="8"></textarea>
      </div>
      <div class="container-fluid text-center bg-body-tertiary">
        <span class="text-body-secondary font-monospace" style="font-size:small">&copy;2025</span>
      </div>
    </footer>
    <script>
      async function fetchLogs() {
        const response = await fetch('/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          }
        });
        const logs = await response.text();
        const resultDiv = document.getElementById('reslogs');
        let logarr = logs.split('\\n');
        logarr.reverse();
        resultDiv.value = logarr.join('\\n').trim();
      }
      window.onload = fetchLogs;
      setInterval(fetchLogs, 2500);
    </script>
  </body>
</html>
`;