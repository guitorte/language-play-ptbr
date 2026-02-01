#!/usr/bin/env python3
"""
Script para carregar listas grandes de palavras no RimaBR
Otimizado para listas com 100k+ palavras
"""

import sys
from pathlib import Path
import time

sys.path.insert(0, str(Path(__file__).parent))

from src.database.rimabr_db import RimaBRDatabase


def load_large_wordlist(db_path: str, wordlist_path: str, batch_size: int = 5000):
    """
    Carrega lista grande de palavras com progresso
    """
    print(f"{'='*80}")
    print(f"CARREGANDO: {wordlist_path}")
    print(f"{'='*80}\n")

    # Ler palavras
    print(f"Lendo arquivo...")
    with open(wordlist_path, 'r', encoding='utf-8') as f:
        words = [line.strip() for line in f if line.strip()]

    print(f"Total de palavras no arquivo: {len(words):,}")

    # Filtrar palavras muito curtas ou inválidas
    valid_words = []
    for word in words:
        # Remover entradas que não são palavras simples
        if len(word) >= 2 and word.isalpha():
            valid_words.append(word)

    print(f"Palavras válidas (2+ letras, apenas alfabéticas): {len(valid_words):,}")
    print(f"\nIniciando indexação (batch size: {batch_size})...")
    print(f"Isso pode levar alguns minutos...\n")

    # Criar banco
    db = RimaBRDatabase(db_path)

    # Indexar
    start_time = time.time()
    db.index_words(valid_words, batch_size=batch_size)
    elapsed = time.time() - start_time

    print(f"\n{'='*80}")
    print(f"CONCLUÍDO!")
    print(f"{'='*80}")
    print(f"Tempo total: {elapsed:.1f} segundos")
    print(f"Velocidade: {len(valid_words)/elapsed:.0f} palavras/segundo")

    # Estatísticas
    print(f"\n{'='*80}")
    print(f"ESTATÍSTICAS DO BANCO")
    print(f"{'='*80}\n")

    stats = db.get_stats()
    print(f"Total indexado: {stats['total_words']:,} palavras\n")

    print("Por tipo de acentuação:")
    for stress, count in stats['by_stress_type'].items():
        pct = (count / stats['total_words'] * 100) if stats['total_words'] > 0 else 0
        print(f"  {stress:<15} {count:>8,} ({pct:>5.1f}%)")

    print("\nTop 20 sufixos mais comuns:")
    for i, (suffix, count) in enumerate(list(stats['top_suffixes'].items())[:20], 1):
        if suffix:
            pct = (count / stats['total_words'] * 100) if stats['total_words'] > 0 else 0
            print(f"  {i:2}. -{suffix:<15} {count:>8,} ({pct:>5.1f}%)")


def main():
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════════╗")
    print("║                                                                        ║")
    print("║               RIMABR - CARREGAMENTO DE LISTAS COMPLETAS                ║")
    print("║                                                                        ║")
    print("╚════════════════════════════════════════════════════════════════════════╝")
    print("\n")

    # Verificar arquivos
    palavras_path = Path("data/palavras_completas.txt")
    kpalavras_path = Path("data/kpalavras.txt")

    if not palavras_path.exists():
        print(f"❌ Arquivo não encontrado: {palavras_path}")
        print("\nBaixe com:")
        print("  curl -L 'https://raw.githubusercontent.com/guitorte/language-play-ptbr/main/upload/palavras.txt' -o data/palavras_completas.txt")
        return

    # Opções
    print("Escolha qual lista carregar:\n")
    print("  1. palavras_completas.txt (~320k palavras)")
    if kpalavras_path.exists():
        print("  2. kpalavras.txt (~52k palavras)")
        print("  3. Ambas (total ~372k palavras)")
    print("  4. Apenas palavras de exemplo (demo)")
    print()

    choice = input("Opção [1-4]: ").strip()

    if choice == "1":
        print("\nCarregando palavras_completas.txt...")
        load_large_wordlist(
            "data/rimabr_completo.db",
            "data/palavras_completas.txt",
            batch_size=5000
        )

    elif choice == "2" and kpalavras_path.exists():
        print("\nCarregando kpalavras.txt...")
        load_large_wordlist(
            "data/rimabr_k.db",
            "data/kpalavras.txt",
            batch_size=2000
        )

    elif choice == "3" and kpalavras_path.exists():
        print("\nCarregando AMBAS as listas...")
        print("\nEtapa 1/2: palavras_completas.txt")
        load_large_wordlist(
            "data/rimabr_completo.db",
            "data/palavras_completas.txt",
            batch_size=5000
        )

        print("\n\nEtapa 2/2: kpalavras.txt")
        load_large_wordlist(
            "data/rimabr_completo.db",
            "data/kpalavras.txt",
            batch_size=2000
        )

    elif choice == "4":
        print("\nCarregando palavras de exemplo...")
        load_large_wordlist(
            "data/rimabr.db",
            "data/palavras_exemplo.txt",
            batch_size=100
        )

    else:
        print("Opção inválida!")
        return

    print(f"\n{'='*80}")
    print("PRÓXIMOS PASSOS")
    print(f"{'='*80}")
    print("""
Agora você pode usar o RimaBR:

  # Buscar rimas
  python rimabr_cli.py --db data/rimabr_completo.db search amor

  # Com filtros
  python rimabr_cli.py --db data/rimabr_completo.db search amor --stress paroxítona --details

  # Busca por padrão
  python rimabr_cli.py --db data/rimabr_completo.db pattern --tonic-vowel a --suffix dade

  # Estatísticas
  python rimabr_cli.py --db data/rimabr_completo.db stats

Veja RIMABR_GUIA.md para mais exemplos!
    """)


if __name__ == "__main__":
    main()
