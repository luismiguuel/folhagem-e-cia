import { Request, Response } from "express";
import { Luminosidade, Prisma } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const luminosidadesPermitidas: string[] = Object.values(Luminosidade);

const camposPermitidos = [
    "nome",
    "especie",
    "preco",
    "estoque",
    "luminosidade",
    "petFriendly",
    "regaACadaDias",
];

const bodyEhObjeto = (body: unknown): body is Record<string, any> => {
    return body !== null && typeof body === "object" && !Array.isArray(body);
};

const validarDadosPlanta = (
    dados: Record<string, any>,
    parcial: boolean = false
): string | null => {

    for (const campo of Object.keys(dados)) {
        if (!camposPermitidos.includes(campo)) {
            return `O campo "${campo}" não é permitido.`;
        }
    }

    if (!parcial) {
        for (const campo of camposPermitidos) {
            if (dados[campo] === undefined) {
                return `O campo "${campo}" é obrigatório.`;
            }
        }
    }

    if (dados.nome !== undefined &&
        (typeof dados.nome !== "string" || dados.nome.trim() === "")) {
        return "O nome deve ser um texto não vazio.";
    }

    if (dados.especie !== undefined &&
        (typeof dados.especie !== "string" || dados.especie.trim() === "")) {
        return "A espécie deve ser um texto não vazio.";
    }

    if (dados.preco !== undefined &&
        (!Number.isInteger(dados.preco) || dados.preco <= 0)) {
        return "O preço deve ser um número inteiro maior que zero, em centavos.";
    }

    if (dados.estoque !== undefined &&
        (!Number.isInteger(dados.estoque) || dados.estoque < 0)) {
        return "O estoque deve ser um número inteiro maior ou igual a zero.";
    }

    if (dados.luminosidade !== undefined &&
        !luminosidadesPermitidas.includes(dados.luminosidade)) {
        return "Luminosidade inválida. Use SOMBRA, MEIA_SOMBRA ou SOL_PLENO.";
    }

    if (dados.petFriendly !== undefined &&
        typeof dados.petFriendly !== "boolean") {
        return "petFriendly deve ser true ou false.";
    }

    if (dados.regaACadaDias !== undefined &&
        (!Number.isInteger(dados.regaACadaDias) || dados.regaACadaDias < 1)) {
        return "regaACadaDias deve ser um número inteiro maior ou igual a um.";
    }

    return null;
};

const converterId = (parametro: string): number | null => {
    const id = Number(parametro);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
};

export const createPlanta = async (req: Request, res: Response) => {
    try {
        const dados = req.body;

        if (!bodyEhObjeto(dados)) {
            return res.status(400).json({
                message: "Envie os dados da planta em um objeto JSON.",
            });
        }

        const erroValidacao = validarDadosPlanta(dados);

        if (erroValidacao) {
            return res.status(400).json({
                message: erroValidacao,
            });
        }

        const planta = await PlantaRepository.createPlanta({
            nome: dados.nome,
            especie: dados.especie,
            preco: dados.preco,
            estoque: dados.estoque,
            luminosidade: dados.luminosidade,
            petFriendly: dados.petFriendly,
            regaACadaDias: dados.regaACadaDias,
        });

        return res.status(201).json(planta);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao cadastrar planta.",
        });
    }
};

export const readAllPlantas = async (req: Request, res: Response) => {
    try {
        const { nome, ordem, luminosidade, petFriendly } = req.query;

        if ( nome !== undefined &&
            (typeof nome !== "string" || nome.trim() === "")) {
            return res.status(400).json({
                message: "O nome deve ser um texto não vazio.",
            });

        }

        if (luminosidade !== undefined &&
            (typeof luminosidade !== "string" ||
            !luminosidadesPermitidas.includes(luminosidade))) {
            return res.status(400).json({
                message: "Luminosidade inválida. Use SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
            });
        }

        if (ordem !== undefined &&
            ordem !== "preco" &&
            ordem !== "nome") {
            return res.status(400).json({
                message: "Ordenação inválida. Use preco ou nome.",
            });
        }

        if (petFriendly !== undefined &&
            petFriendly !== "true" &&
            petFriendly !== "false") {
            return res.status(400).json({
                message: "O filtro petFriendly deve ser true ou false.",
            });
        }

        const filtros: Prisma.PlantaWhereInput = {};

        if (nome !== undefined) {
            filtros.nome = {
                contains: nome.trim(),
                mode: "insensitive",
            };
        }

        if (luminosidade !== undefined) {
            filtros.luminosidade = luminosidade as Luminosidade;
        }

        if (petFriendly !== undefined) {
            filtros.petFriendly = petFriendly === "true";
        }

        let ordenacao: Prisma.PlantaOrderByWithRelationInput | undefined;

        if (ordem === "preco") {
            ordenacao = { preco: "asc" };
        }

        if (ordem === "nome") {
            ordenacao = { nome: "asc" };
        }

        const plantas = await PlantaRepository.findAllPlantas(
            filtros,
            ordenacao
        );

        return res.status(200).json(plantas);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao buscar plantas.",
        });
    }
};

export const readPlantaById = async (req: Request, res: Response) => {
    try {
        const id = converterId(req.params.id);

        if (id === null) {
            return res.status(400).json({
                message: "ID inválido.",
            });
        }

        const planta = await PlantaRepository.findPlantaById(id);

        if (!planta) {
            return res.status(404).json({
                message: "Planta não encontrada.",
            });
        }

        return res.status(200).json(planta);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao buscar planta.",
        });
    }
};

export const updatePlanta = async (req: Request, res: Response) => {
    try {
        const id = converterId(req.params.id);

        if (id === null) {
            return res.status(400).json({
                message: "ID inválido.",
            });
        }

        const planta = await PlantaRepository.findPlantaById(id);

        if (!planta) {
            return res.status(404).json({
                message: "Planta não encontrada.",
            });
        }

        const dados = req.body;

        if (!bodyEhObjeto(dados)) {
            return res.status(400).json({
                message: "Envie os dados da atualização em um objeto JSON.",
            });
        }

        const erroValidacao = validarDadosPlanta(dados, true);

        if (erroValidacao) {
            return res.status(400).json({
                message: erroValidacao,
            });
        }

        const dadosAtualizacao: Prisma.PlantaUpdateInput = dados;

        const plantaAtualizada = await PlantaRepository.updatePlanta(
            id,
            dadosAtualizacao
        );

        return res.status(200).json(plantaAtualizada);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao atualizar planta.",
        });
    }
};

export const deletePlanta = async (req: Request, res: Response) => {
    try {
        const id = converterId(req.params.id);

        if (id === null) {
            return res.status(400).json({
                message: "ID inválido.",
            });
        }

        const planta = await PlantaRepository.findPlantaById(id);

        if (!planta) {
            return res.status(404).json({
                message: "Planta não encontrada.",
            });
        }

        await PlantaRepository.deletePlanta(id);

        return res.status(204).send();

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao deletar planta.",
        });
    }
};

export const sellPlanta = async (req: Request, res: Response) => {
    try {
        const id = converterId(req.params.id);

        if (id === null) {
            return res.status(400).json({
                message: "ID inválido.",
            });
        }

        const dados = req.body;

        if (!bodyEhObjeto(dados) ||
            !Number.isInteger(dados.quantidade) ||
            dados.quantidade <= 0) {
            return res.status(400).json({
                message: "A quantidade deve ser um número inteiro maior que zero.",
            });
        }

        const planta = await PlantaRepository.findPlantaById(id);

        if (!planta) {
            return res.status(404).json({
                message: "Planta não encontrada.",
            });
        }

        const resultado = await PlantaRepository.decreaseStock(
            id,
            dados.quantidade
        );

        if (resultado.count === 0) {
            const plantaAtual = await PlantaRepository.findPlantaById(id);

            if (!plantaAtual) {
                return res.status(404).json({
                    message: "Planta não encontrada.",
                });
            }

            return res.status(400).json({
                message: `Estoque insuficiente. Disponível: ${plantaAtual.estoque}.`,
            });
        }

        const plantaAtualizada = await PlantaRepository.findPlantaById(id);

        return res.status(200).json(plantaAtualizada);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao realizar venda.",
        });
    }
};

export const getInventoryValue = async (req: Request, res: Response) => {
    try {
        const resultado = await PlantaRepository.getInventoryValue();

        return res.status(200).json(resultado);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao calcular o valor do estoque.",
        });
    }
};

export const readPlantasEsgotadas = async (req: Request, res: Response) => {
    try {
        const plantas = await PlantaRepository.findAllPlantas({
            estoque: 0,
        });

        return res.status(200).json(plantas);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erro ao buscar plantas esgotadas.",
        });
    }
};