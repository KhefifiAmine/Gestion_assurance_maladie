const { Journal, User } = require('../../models');
const { Op } = require('sequelize');

const logController = {
    getAllLogs: async (req, res) => {
        try {
            const { 
                action, 
                userId, 
                userName,
                startDate, 
                endDate, 
                page = 1, 
                limit = 20 
            } = req.query;

            const where = {};
            
            if (action) {
                where.action = action;
            }
            
            if (userId) {
                where.userId = parseInt(userId);
            }
            
            if (startDate || endDate) {
                where.createdAt = {};
                if (startDate) {
                    where.createdAt[Op.gte] = new Date(startDate);
                }
                if (endDate) {
                    const endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);
                    where.createdAt[Op.lte] = endDateTime;
                }
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const userWhere = {};
            if (userName) {
                userWhere[Op.or] = [
                    { nom: { [Op.like]: `%${userName}%` } },
                    { prenom: { [Op.like]: `%${userName}%` } }
                ];
            }

            const { count, rows: logs } = await Journal.findAndCountAll({
                where,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'nom', 'prenom', 'email', 'role'],
                        where: userName ? userWhere : undefined,
                        required: userName ? true : false
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            res.json({
                success: true,
                logs,
                total: count,
                totalPages: Math.ceil(count / parseInt(limit)),
                currentPage: parseInt(page)
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des logs:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des logs',
                error: error.message
            });
        }
    },

    createLog: async (req, res) => {
        try {
            const { action, userId } = req.body;

            const log = await Journal.create({
                action,
                userId,
                adresse_ip: req.ip || req.connection.remoteAddress
            });

            res.status(201).json({
                success: true,
                log
            });

        } catch (error) {
            console.error('Erreur lors de la création du log:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du log',
                error: error.message
            });
        }
    }
};

module.exports = logController;