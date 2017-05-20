(function () {

    angular
        .module('app')
        .service('projectsService', projectsService);

    projectsService.$inject = [
        '$q', '$http'
    ];

    function projectsService($q, $http) {

        function getProjects(profile) {
            return $http.get('/api/classes/' + profile.tenant + '/students/' + profile.user_id + '/projects')
                .then(function (resp) {
                    return resp.data;
                });
        }

        function getProject(projectid, userid, tenant) {
            return $http.get('/api/classes/' + tenant + '/students/' + userid + '/projects/' + projectid)
                .then(function (resp) {
                    return resp.data;
                });
        }

        function addLabelToProject(projectid, userid, tenant, newlabel) {
            return $http.patch('/api/classes/' + tenant + '/students/' + userid + '/projects/' + projectid, [
                    {
                        op : 'add',
                        path : '/labels',
                        value : newlabel
                    }
                ])
                .then(function (resp) {
                    return resp.data;
                });
        }

        function deleteProject(project, userid, tenant) {
            return $http.delete('/api/classes/' + tenant + '/students/' + userid + '/projects/' + project.id);
        }

        function createProject(projectAttrs, userid, tenant) {
            return $http.post('/api/classes/' + tenant + '/students/' + userid + '/projects', projectAttrs)
                .then(function (resp) {
                    return resp.data;
                });
        }


        return {
            getProject : getProject,
            getProjects : getProjects,
            deleteProject : deleteProject,
            createProject : createProject,

            addLabelToProject : addLabelToProject
        };
    }
})();