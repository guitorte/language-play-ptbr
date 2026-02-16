#!/usr/bin/env python3
"""
Testes de Separação Silábica baseados nas Regras de Bechara
Moderna Gramática Portuguesa - Evanildo Bechara

Estes testes validam se o syllabifier está seguindo corretamente
as regras fundamentais de separação silábica do português brasileiro.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.syllabifier import syllabify_word
import pytest


class TestRegrasFundamentaisBechara:
    """Testes baseados nas Regras Fundamentais de Separação Silábica"""

    def test_regra_1_consoante_inicial_nao_seguida_vogal(self):
        """
        Regra 1: Consoante inicial não seguida de vogal permanece na sílaba seguinte
        Exemplos: cni-do-se, dze-ta, gno-ma, mne-mô-ni-ca, pneu-má-ti-co
        """
        assert syllabify_word("gnomo") == ["gno", "mo"]
        assert syllabify_word("pneumático") == ["pneu", "má", "ti", "co"]

    def test_regra_2_consoante_interior_nao_seguida_vogal(self):
        """
        Regra 2: No interior, consoante não seguida de vogal fica na sílaba anterior
        Exemplos: ab-di-car, ac-ne, ét-ni-co, nup-ci-al, ob-fir-mar, op-ção
        """
        assert syllabify_word("abdicar") == ["ab", "di", "car"]
        assert syllabify_word("étnico") == ["ét", "ni", "co"]
        assert syllabify_word("nupcial") == ["nup", "ci", "al"]
        assert syllabify_word("opção") == ["op", "ção"]

    def test_regra_3_grupos_consonantais_inseparaveis(self):
        """
        Regra 3: Não se separam grupos consonantais (bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, tr, vr)
        Exemplos: a-blu-ção, a-bra-sar
        """
        assert syllabify_word("ablução") == ["a", "blu", "ção"]
        assert syllabify_word("abrasar") == ["a", "bra", "sar"]
        assert syllabify_word("livro") == ["li", "vro"]
        assert syllabify_word("pedra") == ["pe", "dra"]
        assert syllabify_word("plano") == ["pla", "no"]
        assert syllabify_word("atro") == ["a", "tro"]

    def test_regra_3_digrafos_inseparaveis(self):
        """
        Regra 3: Não se separam os dígrafos ch, lh, nh
        Exemplos: a-che-gar, fi-lho, ma-nhã
        """
        assert syllabify_word("achegar") == ["a", "che", "gar"]
        assert syllabify_word("filho") == ["fi", "lho"]
        assert syllabify_word("manhã") == ["ma", "nhã"]

    def test_regra_4_grupos_sc_sç_bipartidos(self):
        """
        Regra 4: sc e sç no interior são bipartidos
        Exemplos: as-cen-der, nas-cer, des-cer, res-cin-dir
        """
        assert syllabify_word("ascender") == ["as", "cen", "der"]
        assert syllabify_word("nascer") == ["nas", "cer"]
        assert syllabify_word("descer") == ["des", "cer"]
        assert syllabify_word("rescindir") == ["res", "cin", "dir"]

    def test_regra_6_vogais_identicas_separadas(self):
        """
        Regra 6: Vogais idênticas são separadas
        Exemplos: ca-a-tin-ga, co-or-de-nar
        """
        assert syllabify_word("caatinga") == ["ca", "a", "tin", "ga"]
        assert syllabify_word("coordenar") == ["co", "or", "de", "nar"]

    def test_regra_6_consoantes_dobradas_separadas(self):
        """
        Regra 6: cc, cç, rr, ss são separadas
        Exemplos: in-te-lec-ção, oc-ci-pi-tal, pror-ro-gar, res-sur-gir
        """
        assert syllabify_word("intelecção") == ["in", "te", "lec", "ção"]
        assert syllabify_word("prorrogar") == ["pror", "ro", "gar"]
        assert syllabify_word("ressurgir") == ["res", "sur", "gir"]

    def test_regra_6_hiatos_separados(self):
        """
        Regra 6: Vogais de hiatos (mesmo diferentes) se separam
        Exemplos: a-ta-ú-de, ca-í-eis, ca-ir, du-e-lo, fi-el, sa-ú-de
        """
        assert syllabify_word("ataúde") == ["a", "ta", "ú", "de"]
        assert syllabify_word("cair") == ["ca", "ir"]
        assert syllabify_word("duelo") == ["du", "e", "lo"]
        assert syllabify_word("fiel") == ["fi", "el"]
        assert syllabify_word("saúde") == ["sa", "ú", "de"]

    def test_regra_7_ditongos_inseparaveis(self):
        """
        Regra 7: Ditongos e tritongos não se separam
        Exemplos: ai-ro-so, au-ro-ra, cru-éis, gló-ria, joi-as, sá-bio
        """
        assert syllabify_word("airoso") == ["ai", "ro", "so"]
        assert syllabify_word("aurora") == ["au", "ro", "ra"]
        assert syllabify_word("cruéis") == ["cru", "éis"]
        assert syllabify_word("glória") == ["gló", "ria"]
        assert syllabify_word("joias") == ["joi", "as"]
        assert syllabify_word("sábio") == ["sá", "bio"]


class TestPalavrasProblematicas:
    """Testes para as palavras que estavam incorretas nos chunks"""

    def test_palavras_terminadas_em_igo(self):
        """
        Palavras terminadas em -igo devem separar i-go (não -igo junto)
        Regra V+C+V: consoante vai para a próxima sílaba
        """
        # Casos encontrados nos chunks com erro
        assert syllabify_word("comigo") == ["co", "mi", "go"]
        assert syllabify_word("contigo") == ["con", "ti", "go"]
        assert syllabify_word("consigo") == ["con", "si", "go"]
        assert syllabify_word("amigo") == ["a", "mi", "go"]
        assert syllabify_word("antigo") == ["an", "ti", "go"]
        assert syllabify_word("umbigo") == ["um", "bi", "go"]

        # Proparoxítonas
        assert syllabify_word("código") == ["có", "di", "go"]
        assert syllabify_word("pródigo") == ["pró", "di", "go"]

    def test_regra_vcv_consoante_vai_para_proxima_silaba(self):
        """
        Regra fundamental V+C+V (Vogal + Consoante + Vogal):
        A consoante vai para a próxima sílaba (ataque máximo)

        Esta é a regra mais importante que estava sendo violada!
        """
        # Exemplos simples
        assert syllabify_word("bonito") == ["bo", "ni", "to"]
        assert syllabify_word("sapato") == ["sa", "pa", "to"]
        assert syllabify_word("banana") == ["ba", "na", "na"]
        assert syllabify_word("caneta") == ["ca", "ne", "ta"]

        # Com diferentes consoantes
        assert syllabify_word("perigo") == ["pe", "ri", "go"]
        assert syllabify_word("amado") == ["a", "ma", "do"]
        assert syllabify_word("felino") == ["fe", "li", "no"]
        assert syllabify_word("música") == ["mú", "si", "ca"]

    def test_palavras_com_prefixos(self):
        """Palavras com prefixos comuns"""
        assert syllabify_word("recato") == ["re", "ca", "to"]
        assert syllabify_word("recado") == ["re", "ca", "do"]
        assert syllabify_word("desligar") == ["des", "li", "gar"]
        assert syllabify_word("distração") == ["dis", "tra", "ção"]

    def test_palavras_complexas(self):
        """Palavras mais complexas para validação geral"""
        assert syllabify_word("abstrato") == ["abs", "tra", "to"]
        assert syllabify_word("absurdo") == ["ab", "sur", "do"]
        assert syllabify_word("indignado") == ["in", "dig", "na", "do"]
        assert syllabify_word("pescado") == ["pes", "ca", "do"]


class TestCasosEspeciais:
    """Testes para casos especiais e edge cases"""

    def test_palavras_monossilabicas(self):
        """Monossílabos devem retornar uma única sílaba"""
        assert syllabify_word("a") == ["a"]
        assert syllabify_word("eu") == ["eu"]
        assert syllabify_word("pé") == ["pé"]
        assert syllabify_word("mão") == ["mão"]

    def test_palavras_dissilabicas(self):
        """Dissílabos comuns"""
        assert syllabify_word("casa") == ["ca", "sa"]
        assert syllabify_word("bola") == ["bo", "la"]
        assert syllabify_word("leite") == ["lei", "te"]
        assert syllabify_word("noite") == ["noi", "te"]

    def test_palavras_com_acentos(self):
        """Palavras com acentos gráficos"""
        assert syllabify_word("café") == ["ca", "fé"]
        assert syllabify_word("José") == ["Jo", "sé"]
        assert syllabify_word("água") == ["á", "gua"]
        assert syllabify_word("país") == ["pa", "ís"]


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
