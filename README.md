# Joguinhos

Dois jogos calminhos para crianças de 5 e 6 anos, para celular, tablet Android e PC:

- **Colorir**: galeria de desenhos de contorno para pintar e salvar como imagem.
- **Desviar**: corrida em 3 pistas, com gestos de dedo.

HTML5 Canvas e JavaScript puro, funciona offline (PWA). Sem coleta de dados e sem conta.

> README provisório (Fase 1). A versão final vem na última fase.

## Testar no computador

```powershell
cd "D:\Jogos Infantis para Filhos"
.\.venv\Scripts\python.exe tools\servir.py        # abre em http://127.0.0.1:8000
.\.venv\Scripts\python.exe tests\test_fase1.py    # testes com Playwright
```

Preparar o ambiente do zero:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install playwright
.\.venv\Scripts\python.exe -m playwright install chromium
```
