import csv
import requests
import os
import re
import time

# Configurações
INPUT_CSV = 'exercises.csv'
OUTPUT_DIR = 'assets_baixados'

# Cria a pasta de destino se não existir
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def clean_filename(name):
    """Limpa o nome do exercício para ser um nome de arquivo válido"""
    # Remove caracteres inválidos para arquivos (/, \, :, *, ?, ", <, >, |)
    clean = re.sub(r'[\\/*?:"<>|]', "", name)
    # Substitui espaços por underscores e deixa minúsculo
    clean = clean.strip().replace(" ", "_").lower()
    return clean

def get_extension(url):
    """Tenta descobrir a extensão do arquivo (.jpg, .mp4) pela URL"""
    if '.mp4' in url:
        return '.mp4'
    elif '.jpg' in url or '.jpeg' in url:
        return '.jpg'
    elif '.png' in url:
        return '.png'
    elif '.gif' in url:
        return '.gif'
    return ''

def download_file(url, filename):
    try:
        # stream=True é importante para arquivos grandes (vídeos) para não estourar a RAM
        response = requests.get(url, stream=True, timeout=10)
        
        if response.status_code == 200:
            file_path = os.path.join(OUTPUT_DIR, filename)
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
        else:
            print(f"❌ Erro HTTP {response.status_code} para: {url}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

# --- Fluxo Principal ---

print(f"Iniciando leitura de {INPUT_CSV}...")

with open(INPUT_CSV, mode='r', encoding='utf-8') as csvfile:
    # O DictReader permite acessar as colunas pelo nome (ex: row['source'])
    reader = csv.DictReader(csvfile)
    
    total_baixado = 0
    total_ignorado = 0
    
    for row in reader:
        nome_exercicio = row['name']
        url = row['source']
        
        # Verifica se tem URL válida (ignora 'None' string ou vazios)
        if not url or url.strip() == 'None' or url.strip() == '':
            print(f"⏭️  Pulando (sem link): {nome_exercicio}")
            total_ignorado += 1
            continue
            
        # Prepara o nome do arquivo
        ext = get_extension(url)
        if not ext:
            # Se não achou extensão, assume jpg se for image no sourceType, ou pula
            if row.get('sourceType') == 'image':
                ext = '.jpg'
            elif row.get('sourceType') == 'video':
                ext = '.mp4'
            else:
                print(f"⚠️ Extensão desconhecida, pulando: {nome_exercicio}")
                continue

        nome_arquivo = clean_filename(nome_exercicio) + ext
        
        # Verifica se já baixou para não baixar de novo
        if os.path.exists(os.path.join(OUTPUT_DIR, nome_arquivo)):
            print(f"✅ Já existe: {nome_arquivo}")
            continue

        print(f"⬇️  Baixando: {nome_exercicio} -> {nome_arquivo} ...")
        
        sucesso = download_file(url, nome_arquivo)
        
        if sucesso:
            total_baixado += 1
            # Pequena pausa para ser educado com o servidor (evitar bloqueio)
            time.sleep(0.5) 
        else:
            print(f"❌ Falha ao baixar {nome_exercicio}")

print("-" * 30)
print(f"Processo finalizado.")
print(f"Arquivos baixados: {total_baixado}")
print(f"Itens ignorados (sem link): {total_ignorado}")
print(f"Arquivos salvos na pasta: /{OUTPUT_DIR}")