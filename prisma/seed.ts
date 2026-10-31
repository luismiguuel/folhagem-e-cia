import "dotenv/config";
import { PrismaClient, Luminosidade } from "@prisma/client";

const prisma = new PrismaClient();

const plantas = [
    {
        nome: "Samambaia",
        especie: "Nephrolepis exaltata",
        preco: 3000,
        estoque: 10,
        luminosidade: Luminosidade.MEIA_SOMBRA,
        petFriendly: true,
        regaACadaDias: 3,
    },
    {
        nome: "Espada-de-São-Jorge",
        especie: "Dracaena trifasciata",
        preco: 4500,
        estoque: 15,
        luminosidade: Luminosidade.SOL_PLENO,
        petFriendly: false,
        regaACadaDias: 7,
    },
    {
        nome: "Costela-de-Adão",
        especie: "Monstera deliciosa",
        preco: 8000,
        estoque: 0,
        luminosidade: Luminosidade.MEIA_SOMBRA,
        petFriendly: false,
        regaACadaDias: 4,
    },
    {
        nome: "Jiboia",
        especie: "Epipremnum aureum",
        preco: 2500,
        estoque: 8,
        luminosidade: Luminosidade.SOMBRA,
        petFriendly: false,
        regaACadaDias: 5,
    },
    {
        nome: "Suculenta",
        especie: "Echeveria elegans",
        preco: 1800,
        estoque: 0,
        luminosidade: Luminosidade.SOL_PLENO,
        petFriendly: true,
        regaACadaDias: 10,
    },
];

async function main() {
    for (const planta of plantas) {
        const existente = await prisma.planta.findFirst({
            where: {
                nome: planta.nome,
                especie: planta.especie,
            },
        });

        if (!existente) {
            await prisma.planta.create({
                data: planta,
            });
        }
    }

    console.log("Seed executado com sucesso!");
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });